import math
import mesa
import networkx as nx
from enum import Enum


class State(Enum):
    SAFE = 0
    INJURED = 1
    DEAD = 2


def number_state(model, state):
    return sum(1 for a in model.grid.get_all_cell_contents() if a.state is state)


def number_injured(model):
    return number_state(model, State.INJURED)


def number_safe(model):
    return number_state(model, State.SAFE)


def number_killed(model):
    return number_state(model, State.DEAD)


class TornadoDisaster(mesa.Model):
    """A tornado disaster model with some number of agents"""

    def __init__(
        self,
        num_nodes=10,
        avg_node_degree=3,
        initial_safe_size=50,
        tornado_move_chance=0.3,
        tornado_radius=1,
        tornado_intensity=1,
        injury_base_chance=0.1,
        death_chance=0.1,
    ):
        self.num_nodes = num_nodes
        prob = avg_node_degree / self.num_nodes
        self.G = nx.erdos_renyi_graph(n=self.num_nodes, p=prob)
        self.grid = mesa.space.NetworkGrid(self.G)
        self.schedule = mesa.time.RandomActivation(self)
        self.initial_safe_size = initial_safe_size
        self.tornado_move_chance = tornado_move_chance
        self.tornado_radius = tornado_radius
        self.tornado_intensity = tornado_intensity
        self.injury_base_chance = injury_base_chance
        self.death_chance = death_chance

        self.datacollector = mesa.DataCollector(
            {
                "Safe": number_safe,
                "Injured": number_injured,
                "Dead": number_killed,
            }
        )

        # Create agents
        for i, node in enumerate(self.G.nodes()):
            if i < initial_safe_size:
                agent = PersonAgent(i, self, State.SAFE, self.injury_base_chance, self.death_chance)

            else:
                agent = PersonAgent(i, self, State.INJURED, self.injury_base_chance, self.death_chance)

            self.schedule.add(agent)
            self.grid.place_agent(agent, node)

        # Introduce tornado
        self.tornado = Tornado(self, self.tornado_move_chance, self.tornado_radius, self.tornado_intensity)
        self.running = True
        self.datacollector.collect(self)


    def step(self):
        self.schedule.step()
        self.tornado.move()
        self.datacollector.collect(self)


    def run_model(self, n):
        for i in range(n):
            self.step()


class PersonAgent(mesa.Agent):
    def __init__(self, unique_id, model, initial_state, injury_base_chance, death_chance):
        super().__init__(unique_id, model)

        self.state = initial_state
        self.injury_base_chance = injury_base_chance
        self.death_chance = death_chance


    def calculate_injury_chance(self):
        tornado_position = self.model.tornado.position
        tornado_intensity = self.model.tornado.intensity

        # Check if tornado position is valid
        if tornado_position in self.model.G.nodes():

            # Get neighborhood within tornado radius
            neighbors_within_radius = self.model.grid.get_neighborhood(self.pos, radius=self.model.tornado.radius)
            
            # Calculate distance to tornado
            distance_to_tornado = (
                0
                if tornado_position in neighbors_within_radius
                else float("inf")
            )

            # Adjust injury chance based on distance and tornado intensity
            adjusted_chance = (self.injury_base_chance * (1 / (1 + math.exp(-tornado_intensity * (distance_to_tornado - 1)))))

            return min(1.0, adjusted_chance)
        
        else:

            return 0.0  # Tornado position is not valid


    def try_injury(self):
        injury_chance = self.calculate_injury_chance()
        if self.random.random() < injury_chance:
            self.state = State.INJURED
            self.try_death()


    def try_death(self):
        if self.random.random() < self.death_chance:
            self.state = State.DEAD


    def step(self):
        if self.state == State.SAFE and self.model.tornado.position == self.pos:
            self.try_injury()


class Tornado:
    def __init__(self, model, move_chance, radius, intensity):
        self.model = model
        self.move_chance = move_chance
        self.radius = radius
        self.intensity = intensity
        self.position = self.model.random.choice(list(self.model.G.nodes()))


    def move(self):
        if self.model.random.random() < self.move_chance:
            possible_moves = [
                neighbor
                for neighbor in self.model.grid.get_neighborhood(
                    self.position, radius=self.radius
                )
                if self.model.grid.is_cell_empty(neighbor)
            ]
            if possible_moves:
                self.position = self.model.random.choice(possible_moves)


if __name__ == "__main__":
    num_nodes = 100
    avg_node_degree = 5
    initial_safe_size = 40
    tornado_move_chance = 0.3
    tornado_radius = 1
    tornado_intensity = 0.5  # Adjust tornado intensity here
    injury_base_chance = 0.1
    death_chance = 0.5

    # Create an instance of the model
    model = TornadoDisaster(
        num_nodes=num_nodes,
        avg_node_degree=avg_node_degree,
        initial_safe_size=initial_safe_size,
        tornado_move_chance=tornado_move_chance,
        tornado_radius=tornado_radius,
        tornado_intensity=tornado_intensity,
        injury_base_chance=injury_base_chance,
        death_chance=death_chance,
    )

    # Run the model for a certain number of steps
    num_steps = 50
    model.run_model(num_steps)

    print("Safe: {}".format(number_safe(model)))
    print("Injured: {}".format(number_injured(model)))
    print("Dead: {}".format(number_killed(model)))
