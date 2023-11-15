import gradio as gr
import matplotlib.pyplot as plt
from virus_on_network.model import State, VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virus_on_network.server import get_resistant_susceptible_ratio, network_portrayal
import networkx as nx
from matplotlib.lines import Line2D
import time
import geopandas
import geodatasets
import contextily as cx
import random

class VirusInterface():
    def __init__(self):

        self.step = 0
        self.totalNumOfAgents = 0
        self.infected_nodes = []
        self.resistant_nodes = []
        self.susceptible_nodes = []
        self.model = None
        self.start = 1
        self.nodePos = []


        initialLineGraph, initialVirusChart = self.restart(10, 3, 1, 0.4, 0.4, 0.3, 0.5)

        with gr.Blocks(theme='Insuz/Mocha') as self.interface:
            with gr.Row():
                whichGraph = gr.State([])
                with gr.Column(scale=1):
                    numOfSteps = gr.Slider(minimum=1, maximum=100, value=10, step=1, label="Number of Steps")
                    numOfAgents = gr.Slider(minimum=10, maximum=100, value=10, step=1, label="Number of Agents")
                    avgNodeDegree = gr.Slider(minimum=3, maximum=8, value=3, step=1, label="Avg Node Degree")
                    initOutbreakSize = gr.Slider(minimum=1, maximum=10, value=1, step=1, label="Initial Outbreak Size")
                    virusSpreadChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Spread Chance")
                    virusCheckFrequency = gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Check Frequency")
                    recoveryChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.3, step=0.1, label="Recovery Chance")
                    gainResistanceChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.5, step=0.1, label="Gain Resistance Chance")

                with gr.Column(scale=2):
                    loopButton = gr.Button(value='Loop')
                    outputNetworkGraph = gr.Plot(value=initialVirusChart, label="Network Graph")
                    
                with gr.Column(scale=1):
                    restartButton = gr.Button(value='Restart')
                    stepButton = gr.Button(value='Step')
                    dataDropDown = gr.Dropdown(['Line Graph', 'Bar Graph', 'Pie Chart'], label='Type of Chart', value='Line Graph')
                    outputChart = gr.Plot(value=initialLineGraph, label="Chart")
                    outputTextBox = gr.Textbox(label="")
        

            restartButton.click(self.restart, inputs=[numOfAgents, avgNodeDegree, initOutbreakSize, 
                                                                      virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance],
                                                              outputs=[outputChart, outputNetworkGraph])
            
            stepButton.click(self.run_simulation_step, inputs=numOfSteps, outputs=[outputNetworkGraph, outputChart, outputTextBox, dataDropDown])
            dataDropDown.change(self.displayFromDropDown, inputs=dataDropDown, outputs=outputChart)
            loopButton.click(self.loop, inputs=numOfSteps, outputs=[outputNetworkGraph, outputChart, outputTextBox, dataDropDown])

    def loop(self, steps):
        while self.step < steps:
            networkGraph, chart, textbox, dropDown = self.run_simulation_step(steps)
            yield networkGraph, chart, textbox, dropDown
        
    def displayFromDropDown(self, choice):
        if choice == 'Line Graph':
            lineGraph = self.makeVirusLineGraph()
            return lineGraph
        elif choice == 'Bar Graph':
            barGraph = self.makeBarChart()
            return barGraph
        else:
            pieChart = self.makePieChart()
            return pieChart

    def makePieChart(self):
        pieChart = plt.figure(figsize=(7, 4))
        categories = ['Infected', 'Susceptible', 'Resistant']
        values = [number_infected(self.model), number_susceptible(self.model), number_resistant(self.model)]

        filtered_labels = [label for label, size in zip(categories, values) if size != 0]
        filtered_sizes = [value for value in values if value != 0]

        plt.pie(filtered_sizes, labels=filtered_labels, colors=['red', 'green', 'gray'], startangle=90)

        plt.axis('equal')

        return pieChart


    def makeBarChart(self):
        barChart = plt.figure(figsize=(7, 4))
        categories = ['Infected', 'Susceptible', 'Resistant']
        values = [number_infected(self.model), number_susceptible(self.model), number_resistant(self.model)]

        plt.bar(categories, values, color=['red', 'green', 'gray'])

        plt.xlabel('Nodes')
        plt.ylabel('Values')
        plt.title('Number of Nodes of Each Type')

        return barChart


    def makeVirusLineGraph(self):
        fig1 = plt.figure(figsize=(7, 4))
        if self.start:
            plt.scatter(range(0, self.step + 1), self.infected_nodes, linestyle='-', color='red')
            plt.scatter(range(0, self.step + 1), self.resistant_nodes, linestyle = '-', color='gray')
            plt.scatter(range(0, self.step + 1), self.susceptible_nodes, linestyle= '-', color='green')
        else:
            plt.plot(range(0, self.step + 1), self.infected_nodes, linestyle='-', color='red')
            plt.plot(range(0, self.step + 1), self.resistant_nodes, linestyle = '-', color='gray')
            plt.plot(range(0, self.step + 1), self.susceptible_nodes, linestyle= '-', color='green')
        plt.xlabel('Number of Steps')
        plt.ylabel('Number of Nodes Remaining')
        plt.figure(0)
        plt.grid(False)

        return fig1
    
    def makeVirusSimualtionChart(self):

        df = geopandas.read_file(geodatasets.get_path("nybb"))

        fig1, ax = plt.subplots(figsize=(6, 6))
        df_wm = df.to_crs(epsg=3857)
        df_wm.plot(ax=ax, alpha=0.5, edgecolor="k")
        cx.add_basemap(ax)
        
        G = self.model.G
        network_representation = network_portrayal(G)
        
        g = nx.Graph()
        
        for idx, node_data in enumerate(network_representation["nodes"]):
            g.add_node(idx, size=node_data["size"], color=node_data["color"], tooltip=node_data["tooltip"])

        for edge_data in network_representation["edges"]:
            g.add_edge(edge_data["source"], edge_data["target"], color=edge_data["color"], width=edge_data["width"])
             
        node_colors = [g.nodes[node]["color"] for node in g.nodes]
        node_sizes = [g.nodes[node]["size"] * 20 for node in g.nodes]
    

        nx.draw_networkx_nodes(g, self.nodePos, node_size=node_sizes, node_color=node_colors)
    
        plt.tight_layout()
        plt.close(fig1)
        
        return fig1

    def restart(self, numNodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance):
        self.infected_nodes = []
        self.resistant_nodes = []
        self.susceptible_nodes = []
        self.start = 1
        self.step = 0 

        model = VirusOnNetwork(numNodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance)
        self.model = model

        for _ in range(numNodes):

            boundary_sets = [

                # right portion
                {"lat_min": 4961000.210052161, "lat_max": 4980000.269395372, "lon_min": -8235388.09901, "lon_max": -8211000.999260579},
                {"lat_min": 4961000.210052161, "lat_max": 4980000.269395372, "lon_min": -8235388.09901, "lon_max": -8211000.999260579},
                {"lat_min": 4954000.210052161, "lat_max": 4961000.210052161, "lon_min": -8239500.09901, "lon_max": -8228290.999260579},
                {"lat_min": 4984500.269395372, "lat_max": 4997000.269395372, "lon_min": -8228188.09901, "lon_max": -8218000.999260579},

                # left portion
                {"lat_min": 4951000.210052161, "lat_max": 4959000.269395372, "lon_min": -8260000.09901, "lon_max": -8246000.999260579},
                {"lat_min": 4948000.210052161, "lat_max": 4951000.210052161, "lon_min": -8260000.09901, "lon_max": -8248000.999260579},
                {"lat_min": 4942000.210052161, "lat_max": 4945000.210052161, "lon_min": -8263580.09901, "lon_max": -8258500.999260579}           
            ]

            selected_boundaries = random.choice(boundary_sets)

            random_lat = random.uniform(selected_boundaries["lat_min"], selected_boundaries["lat_max"])
            random_lon = random.uniform(selected_boundaries["lon_min"], selected_boundaries["lon_max"])

            self.nodePos.append((random_lon, random_lat))
        
        self.infected_nodes.append(number_infected(self.model))
        self.resistant_nodes.append(number_resistant(self.model))
        self.susceptible_nodes.append(number_susceptible(self.model))

        lineGraph = self.makeVirusLineGraph()
        
        #network graph 
        virusChart = self.makeVirusSimualtionChart()
        
        return lineGraph, virusChart

    def run_simulation_step(self, steps):
        self.start = 0
        if self.step < steps:
            self.step += 1
            self.model.step()

            x = number_infected(self.model)    
            self.infected_nodes.append(x)
            y = number_resistant(self.model)     
            self.resistant_nodes.append(y)
            z = number_susceptible(self.model)    
            self.susceptible_nodes.append(z)
        
        fig1 = self.makeVirusLineGraph()
        
        fig2 = self.makeVirusSimualtionChart()

            
        return fig2, fig1, get_resistant_susceptible_ratio(self.model).replace('<br>', '\n').replace('&infin;', '∞'), gr.Dropdown(['Line Graph', 'Bar Graph', 'Pie Chart'], label='Type of Chart', value='Line Graph')


    def run(self):
        self.interface.launch(show_api=False)


if __name__ == "__main__":
    test = VirusInterface()
    test.run()