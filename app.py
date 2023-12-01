from flask import Flask, render_template, Response, request, redirect, jsonify
from virusOnNetwork.model import State, VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virusOnNetwork.server import get_resistant_susceptible_ratio, network_portrayal

app = Flask(__name__)


@app.route('/')
def home():
   return render_template('index.html')


@app.route('/updateValue', methods=['POST'])
def updateValue():
   data = request.get_json()
   sliderValues = data['values']

   #unpack values from webpage and use them to run the simulation
   numSteps, numNodes, avgNodeDegree, initialOutbreakSize, virusSpreadRadius, virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance = sliderValues
   modelData = runSimulation(numSteps, numNodes, avgNodeDegree, initialOutbreakSize, virusSpreadRadius, virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance)

   #return slider values to index.html for the webpage to be reupdated
   return jsonify(modelData)

#Still in development to return model data
def runSimulation(numSteps, numNodes, avgNodeDegree, initialOutbreakSize, virusSpreadRadius, virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance):
   
   model = VirusOnNetwork(numNodes, avgNodeDegree, initialOutbreakSize, virusSpreadRadius, virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance)
   model.run_model(numSteps)

   return "ran model successfully"


if __name__ == "__main__":  
    app.run(debug = True) 