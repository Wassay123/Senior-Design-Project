import math
import mesa
from virus_on_network.model import VirusOnNetwork, State, number_infected, number_resistant, number_susceptible
import gradio as gr
import pandas as pd

data = {
    'Color': ['black'],
    'Step': [0],
    'NumberOfInfected': [0]
}

dataFrame = pd.DataFrame(data)

def blankGraph(initOutbreakSlider):
    newData = {
        'Color': 'black',
        'Step': 0,
        'NumberOfInfected': initOutbreakSlider
    }

    dataFrame.loc[0] = newData
    return gr.LinePlot(dataFrame, x='Step', y='NumberOfInfected', color='Color', color_legend_position='bottom', title='Step vs Number of Infected', height=200, width=500 )


# Define a function to run the model and return the number of infected agents
def run_model(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, num_steps):
    
    model = VirusOnNetwork(
        num_nodes=num_nodes,
        avg_node_degree=avg_node_degree,
        initial_outbreak_size=initial_outbreak_size,
        virus_spread_chance=virus_spread_chance,
        virus_check_frequency=virus_check_frequency,
        recovery_chance=recovery_chance,
        gain_resistance_chance=gain_resistance_chance
    )
    model.step()
    numOfInfected = number_infected(model)

    newData = {
        'Color': 'black',
        'Step': dataFrame['Step'].iloc[-1] + 1,
        'NumberOfInfected': numOfInfected
    }

    dataFrame.loc[dataFrame['Step'].iloc[-1]+1] = newData

    fig = gr.LinePlot(dataFrame, x='Step', y='NumberOfInfected', color='Color', color_legend_position='bottom', title='Step vs Number of Infected', height=200, width=500 )
    return model.num_nodes, fig
    

# sets the interface
with gr.Blocks() as demo:
    with gr.Row():
        with gr.Column():
            numOfAgents = gr.Slider(minimum=10, maximum=100, step=10, value=10, label='Number of Agents')
            avgNodeDegree = gr.Slider(minimum=3, maximum=8, step=3, value=3, label="Avg Node Degree")
            initOutbreakSize = gr.Slider(minimum=1, maximum=10, step=1, value=1, label="Initial Outbreak Size")
            virusSpreadChance = gr.Slider(minimum=0.0, maximum=1.0, step=0.1, value=0.4, label="Virus Spread Chance")
            virusCheckFrequency = gr.Slider(minimum=0.0, maximum=1.0, step=0.1, value=0.4, label="Virus Check Frequency")
            recoveryChance = gr.Slider(minimum=0.0, maximum=1.0, step=0.1, value=0.3, label="Recovery Chance")
            gainResistanceChance = gr.Slider(minimum=0.0, maximum=1.0, step=0.1, value=0.5, label="Gain Resistance Chance")
            numOfSteps = gr.Slider(minimum=1, maximum=100, step=10, label="Number of Steps")

        with gr.Column():
            totalNumberOfNodes = gr.Textbox(label='Number of Nodes')
            numInfectedGraph = gr.LinePlot(label='Number of Infected Nodes')
            stepButton = gr.Button(value="Step")
        demo.load(blankGraph, inputs=initOutbreakSize, outputs=numInfectedGraph)
        
        stepButton.click(run_model, inputs=[numOfAgents, avgNodeDegree, initOutbreakSize, virusSpreadChance, 
                                         virusCheckFrequency, recoveryChance, gainResistanceChance, numOfSteps], 
                                         outputs=[totalNumberOfNodes, numInfectedGraph])


# Launch the Gradio interface
demo.launch(show_api=False)
