from flask import Flask, render_template, request
from flask_socketio import SocketIO
from virusOnNetwork.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant

app = Flask(__name__)
socketio = SocketIO(app)

model = None  # Initialize the model as a global variable

@app.route('/')
def home():
   return render_template('index.html')

def initialize_simulation(values):
   global model
   # Unpack values from webpage and use them to initialize the simulation
   num_steps, num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance = values
   model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance)

@socketio.on('start_simulation')
def handle_start_simulation(data):
   slider_values = data.get('values', [])
   initialize_simulation(slider_values)

@socketio.on('simulation_update_request')
def handle_simulation_update_request(data):
   step = data.get('step', 0)

   if model is not None:
      simulate_step(step)
   else:
      print("Simulation not initialized. Please start the simulation.")

def simulate_step(step):
   global model
   if model is not None:
      model.step()

      model_data = {
         "step": step,
         "infected": number_infected(model),
         "susceptible": number_susceptible(model),
         "resistant": number_resistant(model)
      }

      socketio.emit('update_event', model_data)

if __name__ == "__main__":
   #The web interface will load at http://127.0.0.1:5000
   socketio.run(app, host='127.0.0.1', port=5000)
