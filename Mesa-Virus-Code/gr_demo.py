import gradio as gr
import matplotlib.pyplot as plt
from virus_on_network.model import State, VirusOnNetwork, number_infected, number_susceptible, number_resistant
from virus_on_network.server import get_resistant_susceptible_ratio, network_portrayal
import networkx as nx
from matplotlib.lines import Line2D
import time

def run_simulation(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance):
    steps = 0
    model = VirusOnNetwork(num_nodes, avg_node_degree, initial_outbreak_size, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance)
    infected_nodes = [number_infected(model)] 
    resitant_nodes =[number_resistant(model)]
    susceptible_nodes = [number_susceptible(model)]         
    
    while True:
        #network graph
        fig1 = plt.figure(figsize=(7, 4))

        G = model.G
        network_representation = network_portrayal(G)
        
        g = nx.Graph()
        
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
        plt.close(fig1)
        
        #line plot
        fig2 = plt.figure(figsize=(7, 4.5))
        
        plt.plot(range(0, steps + 1), infected_nodes, linestyle='-', color='red')
        plt.plot(range(0, steps + 1), resitant_nodes, linestyle = '-', color='gray')
        plt.plot(range(0, steps + 1), susceptible_nodes, linestyle= '-', color='green')
        plt.xlabel('Number of Steps')
        plt.ylabel('Number of Nodes Remaining')
        plt.figure(0)
        plt.grid(False)
        plt.close(fig2)
          
    
        ratio = get_resistant_susceptible_ratio(model).replace('<br>', '\n').replace('&infin;', '∞')
        text = "Steps: {}\n{}".format(steps, ratio)
        
        time.sleep(1)
        
        model.step()
        steps += 1
        
        x = number_infected(model)    
        infected_nodes.append(x)
        y = number_resistant(model)
        resitant_nodes.append(y)
        z = number_susceptible(model)    
        susceptible_nodes.append(z)
        
        yield text, fig1, fig2
        


inputs = [
    gr.Slider(minimum=10, maximum=100, value=10 , step=1, label="Number of Agents"),
    gr.Slider(minimum=3, maximum=8, value=3, step = 1, label="Avg Node Degree"),
    gr.Slider(minimum=1, maximum=10, value=1, step = 1, label="Initial Outbreak Size"),
    gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Spread Chance"),
    gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Check Frequency"),
    gr.Slider(minimum=0.0, maximum=1.0, value=0.3, step=0.1, label="Recovery Chance"),
    gr.Slider(minimum=0.0, maximum=1.0, value=0.5, step=0.1, label="Gain Resistance Chance")
]


demo = gr.Interface(
    title= "Virus Model", 
    theme='Insuz/Mocha', 
    fn=run_simulation, 
    inputs=inputs, 
    outputs= [gr.Textbox(label=""), gr.Plot(label="Network Graph"), gr.Plot(label="Line Plot")],
    allow_flagging = "never"
    )


# with gr.Blocks() as demo:
#     with gr.Row():
#         with gr.Column():
#             inputs = [
#                 gr.Slider(minimum=10, maximum=100, value=10 , step=1, label="Number of Agents"),
#                 gr.Slider(minimum=3, maximum=8, value=3, step = 1, label="Avg Node Degree"),
#                 gr.Slider(minimum=1, maximum=10, value=1, step = 1, label="Initial Outbreak Size"),
#                 gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Spread Chance"),
#                 gr.Slider(minimum=0.0, maximum=1.0, value=0.4, step=0.1, label="Virus Check Frequency"),
#                 gr.Slider(minimum=0.0, maximum=1.0, value=0.3, step=0.1, label="Recovery Chance"),
#                 gr.Slider(minimum=0.0, maximum=1.0, value=0.5, step=0.1, label="Gain Resistance Chance")
#             ]
#             run_button = gr.Button("Run")
#         with gr.Column():
#             out = [gr.Textbox(label=""), gr.Plot(label="Network Graph"), gr.Plot(label="Line Plot")]
#     run_button.click(fn=run_simulation, inputs=inputs, outputs=out)

if __name__ == "__main__":
    demo.queue()
    demo.launch(share = True)
