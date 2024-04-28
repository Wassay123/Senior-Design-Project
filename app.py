from flask import Flask, render_template
from flask_socketio import SocketIO
from mesa_models.virusModel.model import VirusOnNetwork, number_infected, number_susceptible, number_resistant, number_dead

app = Flask(__name__)
socketio = SocketIO(app)

#define global variables
model = None
agent_coordinates = None

# Compile HTML website
@app.route("/")
def home():
   return render_template("index.html")

# Save coordinates of each agent in the backend
@socketio.on("simulation_points")
def simulation_points(data):
   global agent_coordinates
   agent_coordinates = data.get("agent_points", "")


# Web Socket that reads model parameters from the front end
@socketio.on("start_simulation")
def handle_start_simulation(data):
   slider_values = data.get("slider_values", [])
   
   initialize_simulation(slider_values)


def initialize_simulation(values):
   global model
   # Unpack values from the webpage and use them to initialize the simulation
   virus_spread_radius, virus_spread_chance, recovery_chance, death_rate = values
   
   # Define some more abstract model variables here
   virus_check_frequency = 0.4
   gain_resistance_chance = 0.5

   model = VirusOnNetwork(agent_coordinates,
                           virus_spread_radius=virus_spread_radius * 10, 
                           virus_spread_chance=virus_spread_chance, 
                           virus_check_frequency=virus_check_frequency, 
                           recovery_chance=recovery_chance, 
                           gain_resistance_chance=gain_resistance_chance, 
                           death_rate=death_rate)
   
      

@socketio.on("simulation_step")
def handle_simulation_update_request(data):
   step = data.get("step", 0)

   if model:
      simulate_step(step)


def simulate_step(step):
   global model

   if model:
      model.step()

      model_data = {
      "step": step,
      "infected": number_infected(model),
      "susceptible": number_susceptible(model),
      "resistant": number_resistant(model),
      "dead": number_dead(model),
      "agent_states": model.get_agents_states()
      }
         
      # Send model_data for the current step to the update_event web socket (front end will read it to update the website)
      socketio.emit("update_event", model_data)


if __name__ == "__main__":
   # The web interface will load at http://127.0.0.1:5000
   socketio.run(app, host="127.0.0.1", port=5000)
