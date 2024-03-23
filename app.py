from flask import Flask, render_template
from flask_socketio import SocketIO

import matplotlib.pyplot as plt
import pandas as pd
import geopandas as gpd
from pointpats import random

from models.tornadoModel.model import TornadoDisaster, number_injured, number_safe, number_killed, number_of_days
from models.virusModel.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant, number_dead
from models.virusModel.server import network_portrayal

import matplotlib
matplotlib.use('Agg')

app = Flask(__name__)
socketio = SocketIO(app)

#define global variables
model = None
points = None
model_type = None
df = None
zip_code_areas = gpd.read_file('nyc_spatial_data/zip_code_040114.geojson')

# Compile HTML website
@app.route('/')
def home():
   return render_template('index.html')


def initialize_simulation(values):
   global model

   if model_type == "virus":
      # Unpack values from the webpage and use them to initialize the simulation
      num_steps, num_nodes, initial_outbreak_size, virus_spread_radius, virus_spread_chance, recovery_chance, death_rate, sim_speed = values
      
      # Define some more abstract model variables here
      avg_node_degree = 3
      virus_check_frequency = 0.4
      gain_resistance_chance = 0.5

      model = VirusOnNetwork(num_nodes, 
                             avg_node_degree, 
                             initial_outbreak_size, 
                             virus_spread_radius, 
                             virus_spread_chance, 
                             virus_check_frequency, 
                             recovery_chance, 
                             gain_resistance_chance, 
                             death_rate)
   
   
   elif model_type == "tornado":
      # Unpack values from the webpage and use them to initialize the simulation
      num_steps, num_nodes, initial_safe_size, tornado_move_chance, tornado_radius, tornado_intensity, death_rate, sim_speed = values
      
      # Define some more abstract model variables here
      avg_node_degree = 5
      injury_base_chance = 0.3

      model = TornadoDisaster(num_nodes, 
                              avg_node_degree, 
                              initial_safe_size, 
                              tornado_move_chance, 
                              tornado_radius, 
                              tornado_intensity, 
                              injury_base_chance, 
                              death_rate)


      
# Web Socket that reads model parameters from the front end
@socketio.on('start_simulation')
def handle_start_simulation(data):
   global points, df, model_type

   model_type = data.get('model_type', '')
   slider_values = data.get('values', [])
   density_range = data.get('density_range', '')

   initialize_simulation(slider_values)

   min_density, max_density = map(float, density_range.split(','))

   population_densities = pd.read_csv('nyc_spatial_data/nyc_zip_borough_neighborhoods_pop.csv')
   population_densities['zip'] = population_densities['zip'].astype(str)
   merged_data = zip_code_areas.merge(population_densities, how='inner', left_on='ZIPCODE', right_on='zip')

   df = merged_data[(merged_data['density'] >= min_density) & (merged_data['density'] <= max_density)]

   points = pd.DataFrame(random.poisson(df.unary_union, size=model.num_nodes))



@socketio.on('simulation_update_request')
def handle_simulation_update_request(data):

   step = data.get('step', 0)
   img_path = data.get('path', 'static/images/nyc_basemap.png')  # Default path if not provided

   if model is not None:
      simulate_step(step, img_path)



def generate_visual(path):
   global df, model

   fig1, ax = plt.subplots(figsize=(10, 10))

   network = network_portrayal(model.G)

   node_colors = []
        
   for idx, node in enumerate(network["nodes"]):
      node_colors.append(node["color"])
      
   zip_code_areas.plot(ax=ax, color='lightblue', edgecolor='black')
   df.plot(ax=ax, color='steelblue', edgecolor='black')

   points.plot(ax = ax, x = 0, y = 1, kind = 'scatter', s = 50, color = node_colors)
   ax.axis('off')
   plt.savefig(path, bbox_inches = 'tight')
   plt.close(fig1)



def simulate_step(step, path):
   global model
   
   model_data = None

   if model is not None:

      if model_type == "virus":
         model.step()
         generate_visual(path)

         model_data = {
         "step": step,
         "infected": number_infected(model),
         "susceptible": number_susceptible(model),
         "resistant": number_resistant(model),
         "dead": number_dead(model)
      }

      if model_type == "tornado":
         model.step()

         model_data = {
            "step": step,
            "injured": number_injured(model),
            "safe": number_safe(model),
            "dead": number_killed(model), 
            "days_til_cas": number_of_days(model)
         }

      # Send model_data for the current step to the update_event web socket (front end will read it to update the website)
      socketio.emit('update_event', model_data)


if __name__ == "__main__":
   # The web interface will load at http://127.0.0.1:5000
   socketio.run(app, host='127.0.0.1', port=5000)
