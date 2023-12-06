import math
import random
import mesa
from .model import State, VirusOnNetwork, number_infected

def node_coords():
        # if EPSG:4326
        # ny_lat_min, ny_lat_max = 40.4774, 40.9176
        # ny_lon_min, ny_lon_max = -74.2591, -73.7004
        # if ESPG:3857
        ny_lat_min, ny_lat_max = 4935561.210052161, 5000195.269395372
        ny_lon_min, ny_lon_max = -8266485.198766782, -8204290.999260579
        random_lat = random.uniform(ny_lat_min, ny_lat_max)
        random_lon = random.uniform(ny_lon_min, ny_lon_max)
        return random_lon, random_lat

def network_portrayal(G):
    # The model ensures there is always 1 agent per node
    

    def node_color(agent):
        return {State.INFECTED: "#FF0000", State.SUSCEPTIBLE: "#008000"}.get(
            agent.state, "#808080"
        )

    def edge_color(agent1, agent2):
        if State.RESISTANT in (agent1.state, agent2.state):
            return "#000000"
        return "#e8e8e8"

    def edge_width(agent1, agent2):
        if State.RESISTANT in (agent1.state, agent2.state):
            return 3
        return 2

    def get_agents(source, target):
        return G.nodes[source]["agent"][0], G.nodes[target]["agent"][0]

    portrayal = {}
    portrayal["nodes"] = [
        {
            "size": 6,
            "color": node_color(agents[0]),
            "tooltip": f"id: {agents[0].unique_id}<br>state: {agents[0].state.name}",
            "pos": (node_coords()),
        }
        for (_, agents) in G.nodes.data("agent")
    ]

    portrayal["edges"] = [
        {
            "source": source,
            "target": target,
            "color": edge_color(*get_agents(source, target)),
            "width": edge_width(*get_agents(source, target)),
        }
        for (source, target) in G.edges
    ]

    return portrayal


network = mesa.visualization.NetworkModule(network_portrayal, 500, 500)
chart = mesa.visualization.ChartModule(
    [
        {"Label": "Infected", "Color": "#FF0000"},
        {"Label": "Susceptible", "Color": "#008000"},
        {"Label": "Resistant", "Color": "#808080"},
    ]
)


def get_resistant_susceptible_ratio(model):
    ratio = model.resistant_susceptible_ratio()
    ratio_text = "&infin;" if ratio is math.inf else f"{ratio:.2f}"
    infected_text = str(number_infected(model))

    return "Resistant/Susceptible Ratio: {}<br>Infected Remaining: {}".format(
        ratio_text, infected_text
    )


model_params = {
    "num_nodes": mesa.visualization.Slider(
        "Number of agents",
        10,
        10,
        100,
        1,
        description="Choose how many agents to include in the model",
    ),
    "avg_node_degree": mesa.visualization.Slider(
        "Avg Node Degree", 3, 3, 8, 1, description="Avg Node Degree"
    ),
    "initial_outbreak_size": mesa.visualization.Slider(
        "Initial Outbreak Size",
        1,
        1,
        10,
        1,
        description="Initial Outbreak Size",
    ),
    "virus_spread_chance": mesa.visualization.Slider(
        "Virus Spread Chance",
        0.4,
        0.0,
        1.0,
        0.1,
        description="Probability that susceptible neighbor will be infected",
    ),
    "virus_check_frequency": mesa.visualization.Slider(
        "Virus Check Frequency",
        0.4,
        0.0,
        1.0,
        0.1,
        description="Frequency the nodes check whether they are infected by a virus",
    ),
    "recovery_chance": mesa.visualization.Slider(
        "Recovery Chance",
        0.3,
        0.0,
        1.0,
        0.1,
        description="Probability that the virus will be removed",
    ),
    "gain_resistance_chance": mesa.visualization.Slider(
        "Gain Resistance Chance",
        0.5,
        0.0,
        1.0,
        0.1,
        description="Probability that a recovered agent will become "
        "resistant to this virus in the future",
    ),
}

server = mesa.visualization.ModularServer(
    VirusOnNetwork,
    [network, get_resistant_susceptible_ratio, chart],
    "Virus Model",
    model_params,
)
server.port = 8521