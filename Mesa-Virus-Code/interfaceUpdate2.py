import gradio as gr
import matplotlib.pyplot as plt
from virus_on_network.model import State, VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virus_on_network.server import get_resistant_susceptible_ratio, network_portrayal
import networkx as nx
from matplotlib.lines import Line2D
import time

class VirusInterface():
    def __init__(self):

        self.step = 0
        self.infected_nodes = []
        self.resistant_nodes = []
        self.susceptible_nodes = []
        self.model = None
        self.start = 1

        with gr.Blocks(theme='Insuz/Mocha') as self.interface:
            loopButton = gr.Button(value='Loop')
            with gr.Row():
                whichGraph = gr.State([])
                with gr.Column():
                    startSimulationButton = gr.Button(value='Start Simulation')
                    numOfSteps = gr.Slider(minimum=1, maximum=100, value=10, step=1, label="Number of Steps")
                    numOfAgents = gr.Slider(minimum=10, maximum=100, value=10, step=1, label="Number of Agents")
                    avgNodeDegree = gr.Slider(minimum=3, maximum=8, value=3, step=1, label="Avg Node Degree")
                    initOutbreakSize = gr.Slider(minimum=1, maximum=10, value=1, step=1, label="Initial Outbreak Size")
                    virusSpreadChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Spread Chance")
                    virusCheckFrequency = gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Check Frequency")
                    recoveryChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.3, step=0.1, label="Recovery Chance")
                    gainResistanceChance = gr.Slider(minimum=0.0, maximum=1.0, value=0.5, step=0.1, label="Gain Resistance Chance")

                with gr.Column():
                    stepButton = gr.Button(value='Step')
                    outputNetworkGraph = gr.Plot(label="Network Graph")
                    dataDropDown = gr.Dropdown(['Line Graph', 'Bar Graph', 'Pie Chart'], label='Type of Chart', value='Line Graph')
                    outputChart = gr.Plot(label="Chart")
                    outputTextBox = gr.Textbox(label="")
        

            startSimulationButton.click(self.startSimulation, inputs=[numOfAgents, avgNodeDegree, initOutbreakSize, 
                                                                      virusSpreadChance, virusCheckFrequency, recoveryChance, gainResistanceChance],
                                                              outputs=[outputChart, outputNetworkGraph])
            
            stepButton.click(self.run_simulation_step, inputs=numOfSteps, outputs=[outputNetworkGraph, outputChart, outputTextBox, dataDropDown])
            dataDropDown.change(self.displayFromDropDown, inputs=dataDropDown, outputs=outputChart)
            loopButton.click(self.loop, inputs=numOfSteps, outputs=[outputNetworkGraph, outputChart, outputTextBox, dataDropDown])

    def loop(self, steps):
        while self.step < steps:
            networkGraph, chart, textbox, dropDown = self.run_simulation_step(steps)
            time.sleep(0.1)
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
        pieChart = plt.figure(figsize=(7, 2))
        categories = ['Infected', 'Susceptible', 'Resistant']
        values = [number_infected(self.model), number_susceptible(self.model), number_resistant(self.model)]

        filtered_labels = [label for label, size in zip(categories, values) if size != 0]
        filtered_sizes = [value for value in values if value != 0]

        plt.pie(filtered_sizes, labels=filtered_labels, colors=['red', 'green', 'gray'], startangle=90)

        plt.axis('equal')

        return pieChart


    def makeBarChart(self):
        barChart = plt.figure(figsize=(7, 2))
        categories = ['Infected', 'Susceptible', 'Resistant']
        values = [number_infected(self.model), number_susceptible(self.model), number_resistant(self.model)]

        plt.bar(categories, values, color=['red', 'green', 'gray'])

        plt.xlabel('Nodes')
        plt.ylabel('Values')
        plt.title('Number of Nodes of Each Type')

        return barChart


    def makeVirusLineGraph(self):
        fig1 = plt.figure(figsize=(7, 2))
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
        fig2 = plt.figure(figsize=(7, 4.5))

        G = self.model.G
        network_representation = network_portrayal(G)
        
        g = nx.Graph()
        print(network_representation["nodes"])
        for idx, node_data in enumerate(network_representation["nodes"]):
            g.add_node(idx, size=node_data["size"], color=node_data["color"], tooltip=node_data["tooltip"])

        for edge_data in network_representation["edges"]:
            g.add_edge(edge_data["source"], edge_data["target"], color=edge_data["color"], width=edge_data["width"])
            
        pos = nx.kamada_kawai_layout(g)  
        
        node_colors = [g.nodes[node]["color"] for node in g.nodes]
        node_sizes = [g.nodes[node]["size"] * 30 for node in g.nodes]
        edge_colors = [g.edges[edge]["color"] for edge in g.edges]
        edge_widths = [g.edges[edge]["width"] for edge in g.edges]

        nx.draw_networkx_nodes(g, pos, node_size=node_sizes, node_color=node_colors)
        nx.draw_networkx_edges(g, pos, edge_color=edge_colors, width=edge_widths)
        plt.box(False)

        legend_elements = [Line2D([0], [0], marker='o', color='red', label='Infected', lw=0,
                            markerfacecolor='red', markersize=10),
                        Line2D([0], [0], marker='o', color='green', label='Susceptible', lw=0,
                            markerfacecolor='green', markersize=10),
                        Line2D([0], [0], marker = 'o', color = 'grey', label = 'Resistant', lw=0,
                            markerfacecolor='grey', markersize=10)]
        
        ax = plt.gca()
        box = ax.get_position()
        ax.set_position([box.x0, box.y0, box.width * 0.8, box.height])
        ax.legend(handles = legend_elements, loc='upper left', bbox_to_anchor=(1, 1))
        
        return fig2

    def startSimulation(self, num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance):
        model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance)
        self.model = model
        
        self.infected_nodes.append(number_infected(self.model))
        self.resistant_nodes.append(number_resistant(self.model))
        self.susceptible_nodes.append(number_susceptible(self.model))

        fig1 = self.makeVirusLineGraph()
        
        #network graph 
        fig2 = self.makeVirusSimualtionChart()
        
        return fig1, fig2

    def run_simulation_step(self, steps):
        self.start = 0
        self.step += 1
        if self.step < steps + 1:

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