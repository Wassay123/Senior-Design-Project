from mesa import Agent, Model
from mesa.time import RandomActivation
from mesa.space import ContinuousSpace
from mesa.datacollection import DataCollector
from enum import Enum
from flask import jsonify
import math

class State(Enum):
    SUSCEPTIBLE = 0
    INFECTED = 1
    RESISTANT = 2
    DEAD = 3

def number_state(model, state):
    return sum(1 for agent in model.schedule.agents if agent.state == state)

def number_infected(model):
    return number_state(model, State.INFECTED)

def number_susceptible(model):
    return number_state(model, State.SUSCEPTIBLE)

def number_resistant(model):
    return number_state(model, State.RESISTANT)

def number_dead(model):
    return number_state(model, State.DEAD)

def scale_coordinates(coord, min_lat, max_lat, min_long, max_long, scale_x, scale_y, margin=5):
    scaled_x = margin + ((coord[1] - min_long) / (max_long - min_long)) * (scale_x - 2 * margin)
    scaled_y = margin + ((coord[0] - min_lat) / (max_lat - min_lat)) * (scale_y - 2 * margin)
    return (scaled_x, scaled_y)



class VirusOnNetwork(Model):
    def __init__(self, agents_data, width=100, height=100, virus_spread_radius=20, virus_spread_chance=0.4, virus_check_frequency=0.4, recovery_chance=0.3, gain_resistance_chance=0.5, death_rate=0.2):
        self.schedule = RandomActivation(self)
        self.space = ContinuousSpace(width, height, torus=False)
        self.virus_spread_radius = virus_spread_radius
        self.virus_spread_chance = virus_spread_chance
        self.virus_check_frequency = virus_check_frequency
        self.recovery_chance = recovery_chance
        self.gain_resistance_chance = gain_resistance_chance
        self.death_rate = death_rate

        # Assuming min and max values for latitude and longitude are known or can be calculated from agents_data
        min_lat = min(agent['coordinates'][0] for agent in agents_data)
        max_lat = max(agent['coordinates'][0] for agent in agents_data)
        min_long = min(agent['coordinates'][1] for agent in agents_data)
        max_long = max(agent['coordinates'][1] for agent in agents_data)

        for i, agent_info in enumerate(agents_data):
            # Use the provided scale_coordinates function
            pos = scale_coordinates(agent_info['coordinates'], min_lat, max_lat, min_long, max_long, width, height)
            
            # Determine the agent's state based on the color
            if agent_info['color'] == 'green':
                state = State.SUSCEPTIBLE
            elif agent_info['color'] == 'red':
                state = State.INFECTED
            else:
                # Default or unspecified color leads to SUSCEPTIBLE state; adjust as needed
                state = State.SUSCEPTIBLE
            
            agent = VirusAgent(i, self, pos, state, self.virus_spread_radius, self.virus_spread_chance, self.virus_check_frequency, self.recovery_chance, self.gain_resistance_chance, self.death_rate)
            self.schedule.add(agent)
            self.space.place_agent(agent, pos)

        self.datacollector = DataCollector({
            "Susceptible": lambda m: m.number_state(State.SUSCEPTIBLE),
            "Infected": lambda m: m.number_state(State.INFECTED),
            "Resistant": lambda m: m.number_state(State.RESISTANT),
            "Dead": lambda m: m.number_state(State.DEAD)
        })

    def number_state(self, state):
        """Count agents by state."""
        return sum(1 for agent in self.schedule.agents if agent.state is state)

    def step(self):
        self.datacollector.collect(self)
        self.schedule.step()

    def get_agents_states(self):
        return [agent.state.value for agent in self.schedule.agents]

    def resistant_susceptible_ratio(self):
        try:
            return number_state(self, State.RESISTANT) / number_state(
                self, State.SUSCEPTIBLE
            )
        except ZeroDivisionError:
            return math.inf


class VirusAgent(Agent):
    def __init__(self, unique_id, model, pos, state, virus_spread_radius, virus_spread_chance, virus_check_frequency, recovery_chance, gain_resistance_chance, death_rate):
        super().__init__(unique_id, model)
        self.pos = pos  # Store the position of the agent
        self.state = state
        self.virus_spread_radius = virus_spread_radius
        self.virus_spread_chance = virus_spread_chance
        self.virus_check_frequency = virus_check_frequency
        self.recovery_chance = recovery_chance
        self.gain_resistance_chance = gain_resistance_chance
        self.death_rate = death_rate

    def try_to_infect_neighbors(self):
        # Find neighbors within a specified radius in ContinuousSpace
        neighbors = self.model.space.get_neighbors(self.pos, self.virus_spread_radius, include_center=False)
        susceptible_neighbors = [agent for agent in neighbors if agent.state == State.SUSCEPTIBLE]
        
        # Attempt to infect susceptible neighbors
        for neighbor in susceptible_neighbors:
            if self.random.random() < self.virus_spread_chance:
                neighbor.state = State.INFECTED


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
            self.state = State.DEAD

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
    agents = [{'coordinates': [40.6459870823861, -73.97978442274959], 'color': 'green'}, {'coordinates': [40.86358032074523, -73.89109945613701], 'color': 'green'}, {'coordinates': [40.61729281571782, -73.94045017276409], 'color': 'green'}, {'coordinates': [40.67673076357593, -73.78729054175422], 'color': 'green'}, {'coordinates': [40.726698804986825, -73.81926901302002], 'color': 'green'}, {'coordinates': [40.60008237240675, -74.17196392064943], 'color': 'green'}, {'coordinates': [40.83211308171965, -73.92069553875987], 'color': 'green'}, {'coordinates': [40.84777267302635, -73.89056725085115], 'color': 'green'}, {'coordinates': [40.55598140484815, -74.18904757331794], 'color': 'green'}, {'coordinates': [40.89091139834255, -73.8185322254578], 'color': 'red'}]

    # Create an instance of the model
    model = VirusOnNetwork(agents)

    # Run the model for a certain number of steps
    for i in range(10):  # Run the model for 10 steps, or any number you choose
        print("Susceptible : {}".format(number_susceptible(model)))
        print("Infected : {}".format(number_infected(model)))
        print("Resistant : {}".format(number_resistant(model)))
        print("Dead : {}".format(number_dead(model)))
        print(model.get_agents_states())
        print()

        model.step()

