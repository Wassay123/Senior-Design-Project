from flask import Flask, render_template, request
from flask_socketio import SocketIO
from virusOnNetwork.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant, number_dead
from virusOnNetwork.server import network_portrayal
import matplotlib.pyplot as plt
import contextily as cx
import networkx as nx
import geopandas
import geodatasets
import pointpats


app = Flask(__name__)
socketio = SocketIO(app)

model = None  # Initialize the model as a global variable


#Compile html website
@app.route('/')
def home():
   return render_template('index.html')


def initialize_simulation(values):
   global model
   # Unpack values from webpage and use them to initialize the simulation
   num_steps, num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, death_rate = values
   model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, death_rate)


#Web Socket that reads model parameters from front end
@socketio.on('start_simulation')
def handle_start_simulation(data):
   slider_values = data.get('values', [])
   initialize_simulation(slider_values)


#Web Socket that reads in information from the JavaScript setInterval function telling model to send model data for the next step
@socketio.on('simulation_update_request')
def handle_simulation_update_request(data):
   step = data.get('step', 0)

   if model is not None:
      simulate_step(step)

   
def simulate_step(step):
   global model
   
   df = geopandas.read_file(geodatasets.get_path("nybb"))
   df_wm = df.to_crs(epsg=3857)
   
   #generates random points within a multipolygon
   points = pointpats.random.poisson(df_wm.unary_union, size= model.num_nodes)
   
   if model is not None:
      model.step()
      
      fig1, ax = plt.subplots(figsize=(10, 10))
      df_wm.plot(ax=ax, alpha=0.5, edgecolor="k")
      cx.add_basemap(ax)
      
      network = network_portrayal(model.G)
      
      g = nx.Graph()
      
      for idx, node_data in enumerate(network["nodes"]):
            g.add_node(idx, size=node_data["size"], color=node_data["color"], tooltip=node_data["tooltip"])
            
      node_colors = [g.nodes[node]["color"] for node in g.nodes]
      node_sizes = [g.nodes[node]["size"] * 20 for node in g.nodes]
      
      nx.draw_networkx_nodes(g, points, node_size=node_sizes, node_color=node_colors)
      plt.tight_layout()
      plt.savefig('static/nyc_map.png')
      plt.close(fig1)
      

      model_data = {
         "step": step,
         "infected": number_infected(model),
         "susceptible": number_susceptible(model),
         "resistant": number_resistant(model),
         "dead": number_dead(model)
      }
      

      #Send model_data for the current step to the update_event web socket (front end will read it to update the website)
      socketio.emit('update_event', model_data)
      


if __name__ == "__main__":
   #The web interface will load at http://127.0.0.1:5000
   socketio.run(app, host='127.0.0.1', port=5000)
