from flask import Flask, render_template
from flask_socketio import SocketIO

from virusOnNetwork.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant, number_dead
from virusOnNetwork.server import network_portrayal
import matplotlib.pyplot as plt
import pandas as pd
import geopandas as gpd
from pointpats import random

import matplotlib
matplotlib.use('Agg')

app = Flask(__name__)
socketio = SocketIO(app)

model = None
zip_code_areas = gpd.read_file('zip_code_040114.geojson')
df = None
points = None

# Compile HTML website
@app.route('/')
def home():
   """Render the main HTML page."""
   return render_template('index.html')


def initialize_simulation(values):
   """Initialize the simulation model.

   Args:
      values (list): List of parameters for initializing the simulation model.
   """

   global model
   # Unpack values from the webpage and use them to initialize the simulation
   num_steps, num_nodes, initial_outbreak_size, virus_spread_radius, virus_spread_chance, recovery_chance, death_rate = values
   model = VirusOnNetwork(num_nodes, 3, initial_outbreak_size, virus_spread_radius, virus_spread_chance, 0.4, recovery_chance, 0.5, death_rate)




# Web Socket that reads model parameters from the front end
@socketio.on('start_simulation')
def handle_start_simulation(data):
   """Handle the start of the simulation.

   Args:
      data (dict): Dictionary containing simulation parameters.
   """
   global points, df
   
   slider_values = data.get('values', [])
   density_range = data.get('density_range', '')
   initialize_simulation(slider_values)
   
   min_density, max_density = map(float, density_range.split(','))
   
   population_densities = pd.read_csv('nyc_zip_borough_neighborhoods_pop.csv')
   
   population_densities['zip'] = population_densities['zip'].astype(str)
   
   merged_data = zip_code_areas.merge(population_densities, how='inner', left_on='ZIPCODE', right_on='zip')
   
   df = merged_data[(merged_data['density'] >= min_density) & 
                            (merged_data['density'] <= max_density)]

   points = pd.DataFrame(random.poisson(df.unary_union, size=model.num_nodes))



@socketio.on('simulation_update_request')
def handle_simulation_update_request(data):
   """Handle the request for a simulation update.

   Args:
      data (dict): Dictionary containing update information, including the step and optional path.
   """

   step = data.get('step', 0)
   path = data.get('path', 'static/simulation_visual_test.png')  # Default path if not provided

   if model is not None:
      simulate_step(step, path)


def generate_visual(path):
   """Generate a visualization and save it to the specified path.

   Args:
      path (str): Path to save the visualization image.
   """
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
   """Simulate a step of the model and generate a visualization.

   Args:
      step (int): Current simulation step.
      path (str): Path to save the visualization image.
   """

   global model

   if model is not None:
      model.step()
      generate_visual(path)

      model_data = {
         "step": step,
         "infected": number_infected(model),
         "susceptible": number_susceptible(model),
         "resistant": number_resistant(model),
         "dead": number_dead(model)
      }

      # Send model_data for the current step to the update_event web socket (front end will read it to update the website)
      socketio.emit('update_event', model_data)


if __name__ == "__main__":
   # The web interface will load at http://127.0.0.1:5000
   socketio.run(app, host='127.0.0.1', port=5000)
