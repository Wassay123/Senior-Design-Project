from flask import Flask, render_template
from flask_socketio import SocketIO

from virusOnNetwork.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant, number_dead
from virusOnNetwork.server import network_portrayal

import matplotlib.pyplot as plt
import contextily as cx
import networkx as nx
import geopandas
import geodatasets
import pointpats

import matplotlib
matplotlib.use('Agg')

app = Flask(__name__)
socketio = SocketIO(app)

model = None  # Initialize the model as a global variable
df_wm = geopandas.read_file(geodatasets.get_path("nybb")).to_crs(epsg=3857)


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

   slider_values = data.get('values', [])
   initialize_simulation(slider_values)


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
   global df_wm, model

   # Load the basemap image
   basemap_img = plt.imread('static/nyc_basemap.png')

   # Generate random points within a multipolygon using the algorithm
   points = pointpats.random.poisson(df_wm.unary_union, size=model.num_nodes)

   fig1, ax = plt.subplots(figsize=(10, 10))

   # Plot the basemap image
   ax.imshow(basemap_img, extent=(df_wm.total_bounds[0], df_wm.total_bounds[2], df_wm.total_bounds[1], df_wm.total_bounds[3]))

   # Turn off the axis frame
   ax.axis('off')

   network = network_portrayal(model.G)

   g = nx.Graph()

   for idx, node_data in enumerate(network["nodes"]):
      g.add_node(idx, size=node_data["size"], color=node_data["color"], tooltip=node_data["tooltip"])

   node_colors = [g.nodes[node]["color"] for node in g.nodes]
   node_sizes = [g.nodes[node]["size"] * 20 for node in g.nodes]

   # Overlay the generated points on top of the basemap image
   ax.scatter(points[:, 0], points[:, 1], color=node_colors, marker='o', s=node_sizes, alpha=0.7)

   plt.tight_layout()
   plt.savefig(path)
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
