import math
import mesa
import networkx as nx
from enum import Enum


class State(Enum):
    SUSCEPTIBLE = 0
    INFECTED = 1
    RESISTANT = 2
    DEAD = 3


def number_state(model, state):
    return sum(1 for a in model.grid.get_all_cell_contents() if a.state is state)


def number_infected(model):
    return number_state(model, State.INFECTED)


def number_susceptible(model):
    return number_state(model, State.SUSCEPTIBLE)


def number_resistant(model):
    return number_state(model, State.RESISTANT)

def number_dead(model):
    return number_state(model, State.DEAD)



class VirusOnNetwork(mesa.Model):
    """A virus model with some number of agents"""

    def __init__(
        self,
        num_nodes=10,
        avg_node_degree=3,
        initial_outbreak_size=1,
        virus_spread_radius=1,
        virus_spread_chance=0.4,
        virus_check_frequency=0.4,
        recovery_chance=0.3,
        gain_resistance_chance=0.5,
        death_rate=0.2
        
    ):
        self.num_nodes = num_nodes
        prob = avg_node_degree / self.num_nodes
        self.G = nx.erdos_renyi_graph(n=self.num_nodes, p=prob)
        self.grid = mesa.space.NetworkGrid(self.G)
        self.schedule = mesa.time.RandomActivation(self)
        self.initial_outbreak_size = (
            initial_outbreak_size if initial_outbreak_size <= num_nodes else num_nodes
        )
        self.virus_spread_chance = virus_spread_chance
        self.virus_check_frequency = virus_check_frequency
        self.recovery_chance = recovery_chance
        self.gain_resistance_chance = gain_resistance_chance
        self.virus_spread_radius = virus_spread_radius
        self.death_rate = death_rate

        self.datacollector = mesa.DataCollector(
            {
                "Infected": number_infected,
                "Susceptible": number_susceptible,
                "Resistant": number_resistant,
                "Death": number_dead
            }
        )

        # Create agents
        for i, node in enumerate(self.G.nodes()):
            a = VirusAgent(
                i,
                self,
                State.SUSCEPTIBLE,
                self.virus_spread_radius,
                self.virus_spread_chance,
                self.virus_check_frequency,
                self.recovery_chance,
                self.gain_resistance_chance,
                self.death_rate
            )
            self.schedule.add(a)
            # Add the agent to the node
            self.grid.place_agent(a, node)

        # Infect some nodes
        infected_nodes = self.random.sample(list(self.G), self.initial_outbreak_size)
        for a in self.grid.get_cell_list_contents(infected_nodes):
            a.state = State.INFECTED

        self.running = True
        self.datacollector.collect(self)

    def resistant_susceptible_ratio(self):
        try:
            return number_state(self, State.RESISTANT) / number_state(
                self, State.SUSCEPTIBLE
            )
        except ZeroDivisionError:
            return math.inf

    def step(self):
        self.schedule.step()
        # collect data
        self.datacollector.collect(self)

    def run_model(self, n):
        for i in range(n):
            self.step()


class VirusAgent(mesa.Agent):
    def __init__(
        self,
        unique_id,
        model,
        initial_state,
        virus_spread_radius,
        virus_spread_chance,
        virus_check_frequency,
        recovery_chance,
        gain_resistance_chance,
        death_rate
    ):
        super().__init__(unique_id, model)

        self.state = initial_state

        self.virus_spread_chance = virus_spread_chance
        self.virus_check_frequency = virus_check_frequency
        self.recovery_chance = recovery_chance
        self.gain_resistance_chance = gain_resistance_chance
        self.virus_spread_radius = virus_spread_radius
        self.death_rate = death_rate

    def try_to_infect_neighbors(self):
        #check all agents in radius r from self
        #if agents are in that radius then try to infect them
        #else do nothing

        neighbors_nodes = self.model.grid.get_neighborhood(
            self.pos, include_center=False, radius=self.virus_spread_radius
        )
        susceptible_neighbors = [
            agent
            for agent in self.model.grid.get_cell_list_contents(neighbors_nodes)
            if agent.state is State.SUSCEPTIBLE
        ]
        for a in susceptible_neighbors:
            if self.random.random() < self.virus_spread_chance:
                a.state = State.INFECTED

    def try_gain_resistance(self):
        if self.random.random() < self.gain_resistance_chance:
            self.state = State.RESISTANT

    def try_remove_infection(self):
        # Try to remove
        if self.random.random() < self.recovery_chance:
            # Success
            self.state = State.SUSCEPTIBLE
            self.try_gain_resistance()
        elif self.random.random() > self.model.death_rate:
            # Failed, but survived (did not die)
            self.state = State.INFECTED
        else:
            # Failed and died
            self.state = State.RESISTANT

    def try_check_situation(self):
        if (self.random.random() < self.virus_check_frequency) and (
            self.state is State.INFECTED
        ):
            self.try_remove_infection()

    def step(self):
        if self.state is State.INFECTED:
            self.try_to_infect_neighbors()
        self.try_check_situation()


if __name__ == "__main__":
    num_nodes = 50
    avg_node_degree = 5
    initial_outbreak_size = 1
    virus_spread_radius = 1
    virus_spread_chance = 0.4
    virus_check_frequency = 0.4
    recovery_chance = 0.3
    gain_resistance_chance = 0.5
    death_rate = 0.1  # Set your desired death rate

    # Create an instance of the model
    model = VirusOnNetwork(
        num_nodes=num_nodes,
        avg_node_degree=avg_node_degree,
        initial_outbreak_size=initial_outbreak_size,
        virus_spread_radius=virus_spread_radius,
        virus_spread_chance=virus_spread_chance,
        virus_check_frequency=virus_check_frequency,
        recovery_chance=recovery_chance,
        gain_resistance_chance=gain_resistance_chance,
        death_rate=death_rate
    )

    # Run the model for a certain number of steps
    num_steps = 50
    model.run_model(num_steps)

    # Collect and print data
    data = model.datacollector.get_agent_vars_dataframe()
    print(data)
