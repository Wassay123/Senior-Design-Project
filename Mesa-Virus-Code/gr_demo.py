import gradio as gr
import matplotlib.pyplot as plt
from virus_on_network.model import State, VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virus_on_network.server import get_resistant_susceptible_ratio, network_portrayal
import networkx as nx
from matplotlib.lines import Line2D
import time
import geopandas
import geoplot
import numpy as np
import pandas as pd
import geopandas
import geodatasets
import contextily as cx
import random


def run_simulation(graph_type, num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, virus_radius):
    steps = 0
    model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, virus_radius)
    infected_nodes = [number_infected(model)] 
    resitant_nodes =[number_resistant(model)]
    susceptible_nodes = [number_susceptible(model)] 
    node_pos = []
    
    for node in range(num_nodes):
        # if EPSG:4326
        # ny_lat_min, ny_lat_max = 40.4774, 40.9176
        # ny_lon_min, ny_lon_max = -74.2591, -73.7004
        # if ESPG:3857
        ny_lat_min, ny_lat_max = 4935561.210052161, 5000195.269395372
        ny_lon_min, ny_lon_max = -8266485.198766782, -8204290.999260579
        random_lat = random.uniform(ny_lat_min, ny_lat_max)
        random_lon = random.uniform(ny_lon_min, ny_lon_max)
        node_pos.append((random_lon, random_lat))
    
    while True:

        df = geopandas.read_file(geodatasets.get_path("nybb"))

        fig1, ax = plt.subplots(figsize=(10, 10))
        df_wm = df.to_crs(epsg=3857)
        df_wm.plot(ax=ax, alpha=0.5, edgecolor="k")
        cx.add_basemap(ax)
        
        G = model.G
        network_representation = network_portrayal(G)
        
        g = nx.Graph()
        
        for idx, node_data in enumerate(network_representation["nodes"]):
            g.add_node(idx, size=node_data["size"], color=node_data["color"], tooltip=node_data["tooltip"])

        for edge_data in network_representation["edges"]:
            g.add_edge(edge_data["source"], edge_data["target"], color=edge_data["color"], width=edge_data["width"])
             
        node_colors = [g.nodes[node]["color"] for node in g.nodes]
        node_sizes = [g.nodes[node]["size"] * 20 for node in g.nodes]
    

        nx.draw_networkx_nodes(g, node_pos, node_size=node_sizes, node_color=node_colors)
    
        plt.tight_layout()
        plt.close(fig1)
        
        # legend_elements = [Line2D([0], [0], marker='o', color='red', label='Infected', lw=0,
        #                         markerfacecolor='red', markersize=10),
        #                     Line2D([0], [0], marker='o', color='green', label='Susceptible', lw=0,
        #                         markerfacecolor='green', markersize=10),
        #                     Line2D([0], [0], marker = 'o', color = 'grey', label = 'Resistant', lw=0,
        #                         markerfacecolor='grey', markersize=10)]
        
        # ax = plt.gca()
        # box = ax.get_position()
        # ax.set_position([box.x0, box.y0, box.width * 0.8, box.height])
        # ax.legend(handles = legend_elements, loc='upper left', bbox_to_anchor=(1, 1))
    
        if graph_type == "Line Plot":
            
            fig2 = plt.figure(figsize=(7, 4.5))
            
            plt.plot(range(0, steps + 1), infected_nodes, linestyle='-', color='red')
            plt.plot(range(0, steps + 1), resitant_nodes, linestyle = '-', color='gray')
            plt.plot(range(0, steps + 1), susceptible_nodes, linestyle= '-', color='green')
            plt.xlabel('Number of Steps')
            plt.ylabel('Number of Nodes Remaining')
            plt.figure(0)
            plt.grid(False)
            plt.close(fig2)
        
        else:
            fig2 = plt.figure(figsize=(7, 4.5))
            
            x = ["Infected", "Resistant", "Susceptible"]
            y = [number_infected(model), number_resistant(model), number_susceptible(model)]
            plt.bar(x , y, color = ['red', 'gray' , 'green'])
            plt.ylabel('Number of Nodes Remaining')
            plt.figure(0)
            plt.close(fig2)
            
    
        ratio = get_resistant_susceptible_ratio(model).replace('<br>', '\n').replace('&infin;', '∞')
        text = "Steps: {}\n{}".format(steps, ratio)
        
        time.sleep(1)
        
        model.step()
        steps += 1
        
        infected_nodes.append(number_infected(model))
        resitant_nodes.append(number_resistant(model))
        susceptible_nodes.append(number_susceptible(model))
        
        yield text, fig1, fig2
        


with gr.Blocks(title = "Virus Model", theme = "Insuz/Mocha") as demo:
    with gr.Row():
        with gr.Column():
            inputs = [
                gr.Dropdown(choices = ["Line Plot", "Bar Graph"], value= "Line Plot", label= "Graph"),
                gr.Slider(minimum=10, maximum=100, value=10 , step=1, label="Number of Agents"),
                gr.Slider(minimum=3, maximum=8, value=3, step = 1, label="Avg Node Degree"),
                gr.Slider(minimum=1, maximum=10, value=1, step = 1, label="Initial Outbreak Size"),
                gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Spread Chance"),
                gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Check Frequency"),
                gr.Slider(minimum=0.0, maximum=1.0, value=0.3, step=0.1, label="Recovery Chance"),
                gr.Slider(minimum=0.0, maximum=1.0, value=0.5, step=0.1, label="Gain Resistance Chance"),
                gr.Slider(minimum=0, maximum=5, value=1, step=1, label="Virus Infection Radius")
            ]
            with gr.Row():
                stop_button = gr.Button("Stop")
                run_button = gr.Button("Run")
        with gr.Column():
            out = [gr.Textbox(show_label= False), gr.Plot(show_label= False), gr.Plot(show_label= False)]
    run = run_button.click(fn=run_simulation, inputs=inputs, outputs = out)
    stop = stop_button.click(None, None, None, cancels = run)
    
    

if __name__ == "__main__":
    demo.queue()
    demo.launch(share = True)
