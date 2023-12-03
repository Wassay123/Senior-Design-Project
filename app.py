from flask import Flask, render_template, request
from virusOnNetwork.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virusOnNetwork.server import get_resistant_susceptible_ratio, network_portrayal
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def home():
   return render_template('index.html')

@app.route('/updateValue', methods=['POST'])
def run_simulation():
   data = request.get_json()
   slider_values = data['values']

   # Unpack values from webpage and use them to run the simulation
   num_steps, num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance = slider_values
   model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance)

   # Run simulation and send results to websocket client (in script.js)
   for step in range(num_steps):
      model.step()

      model_data = {
         "step": step,
         "infected": number_infected(model),
         "susceptible": number_susceptible(model),
         "resistant": number_resistant(model)
      }

      socketio.emit('simulation_update', model_data)

   #Return an empty response to HTTPS POST (Response is not used anywhere)
   return '', 204


if __name__ == "__main__":
   socketio.run(app, host='127.0.0.1', port=5000)

