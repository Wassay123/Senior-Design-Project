from mesa import Agent, Model
from mesa.time import RandomActivation
from mesa.space import ContinuousSpace
from mesa.datacollection import DataCollector
from enum import Enum
import math
import numpy as np

class State(Enum):
    SAFE = 0
    INJURED = 1
    DEAD = 2

def number_state(model, state):
    return sum(1 for agent in model.schedule.agents if hasattr(agent, 'state') and agent.state == state)

def number_injured(model):
    return number_state(model, State.INJURED)

def number_safe(model):
    return number_state(model, State.SAFE)

def number_killed(model):
    return number_state(model, State.DEAD)

def number_of_days(model):
    return model.first_casualty_step #returns number of days until the first casuality occurs

def scale_coordinates(coord, min_lat, max_lat, min_long, max_long, scale_x, scale_y, margin=5):
    scaled_x = margin + ((coord[1] - min_long) / (max_long - min_long)) * (scale_x - 2 * margin)
    scaled_y = margin + ((coord[0] - min_lat) / (max_lat - min_lat)) * (scale_y - 2 * margin)
    return (scaled_x, scaled_y)

class TornadoDisaster(Model):
    def __init__(self, agents_data, width=100, height=100, tornado_move_chance=0.9, tornado_radius=40, tornado_intensity=10, injury_base_chance=0.7, death_chance=0.5):
        self.schedule = RandomActivation(self)
        self.space = ContinuousSpace(width, height, torus=False)
        self.tornado_move_chance = tornado_move_chance
        self.tornado_radius = tornado_radius
        self.tornado_intensity = tornado_intensity
        self.injury_base_chance = injury_base_chance
        self.death_chance = death_chance
        self.first_casualty_step = 0 

        self.tornado = Tornado(0, self, tornado_move_chance, tornado_radius, tornado_intensity)
        self.schedule.add(self.tornado)

        # Calculate min and max values for latitude and longitude from the agents_data
        min_lat = min(agent['coordinates'][0] for agent in agents_data)
        max_lat = max(agent['coordinates'][0] for agent in agents_data)
        min_long = min(agent['coordinates'][1] for agent in agents_data)
        max_long = max(agent['coordinates'][1] for agent in agents_data)

        for i, agent_info in enumerate(agents_data):
            pos = scale_coordinates(agent_info['coordinates'], min_lat, max_lat, min_long, max_long, width, height)

            # Determine the agent's state based on the color
            if agent_info['color'] == 'green':
                state = State.SAFE
            elif agent_info['color'] == 'red':
                state = State.INJURED
            else:
                # Default or unspecified color leads to SUSCEPTIBLE state; adjust as needed
                state = State.SAFE

            agent = PersonAgent(i+1, self, pos, state, injury_base_chance, death_chance)
            self.schedule.add(agent)
            self.space.place_agent(agent, pos)

        self.datacollector = DataCollector({
            "Safe": lambda m: number_safe(m),
            "Injured": lambda m: number_injured(m),
            "Dead": lambda m: number_killed(m),
            "Days until first casuality": number_of_days,
        })

    def step(self):
        self.datacollector.collect(self)
        self.schedule.step()
        self.tornado.move()

        if self.first_casualty_step == 0 and (number_killed(self)) > 0:
            self.first_casualty_step = self.schedule.steps


class PersonAgent(Agent):
    def __init__(self, unique_id, model, pos, state, injury_base_chance, death_chance):
        super().__init__(unique_id, model)
        self.pos = pos 
        self.state = state 
        self.injury_base_chance = injury_base_chance 
        self.death_chance = death_chance

    def calculate_injury_chance(self):
        # Calculate the distance from the tornado to this agent
        tornado_position = self.model.tornado.pos
        distance_to_tornado = self.model.space.get_distance(self.pos, tornado_position)
        # Determine if the agent is within the tornado's radius
        if distance_to_tornado <= self.model.tornado.radius:
            return self.injury_base_chance  # Agent is within tornado radius
        else:
            return 0  # Agent is safe

    def try_injury(self):
        if self.state == State.SAFE:  # Check only if agent is initially safe
            injury_chance = self.calculate_injury_chance()
            if self.random.random() < injury_chance:
                # Agent gets injured, check for possible death
                self.try_death()
                if self.state != State.DEAD:  # If the agent didn't die, they become injured
                    self.state = State.INJURED

    def try_death(self):
        if self.random.random() < self.death_chance:
            self.state = State.DEAD

    def step(self):
        self.try_injury()


class Tornado(Agent):
    def __init__(self, unique_id, model, move_chance, radius, intensity):
        super().__init__(unique_id, model)
        self.move_chance = move_chance
        self.radius = radius
        self.intensity = intensity
        # Initialize the tornado's position within the bounds of the space
        self.pos = np.array([
            self.random.uniform(0, model.space.width),
            self.random.uniform(0, model.space.height)
        ])

    def move(self):
        if self.random.random() < self.move_chance:
            direction = self.random.uniform(0, 2 * np.pi)
            distance = self.random.uniform(0, self.radius)
            delta_x = distance * np.cos(direction)
            delta_y = distance * np.sin(direction)
            
            # Calculate the new position while ensuring it's within bounds
            new_x = np.clip(self.pos[0] + delta_x, 0, self.model.space.width)
            new_y = np.clip(self.pos[1] + delta_y, 0, self.model.space.height)
            new_position = (new_x, new_y)
            
            # Move the tornado to the new position
            self.model.space.move_agent(self, new_position)
            self.pos = new_position


if __name__ == "__main__":
    agents = [{'coordinates': [40.6459870823861, -73.97978442274959], 'color': 'green'}, {'coordinates': [40.86358032074523, -73.89109945613701], 'color': 'green'}, {'coordinates': [40.61729281571782, -73.94045017276409], 'color': 'green'}, {'coordinates': [40.67673076357593, -73.78729054175422], 'color': 'green'}, {'coordinates': [40.726698804986825, -73.81926901302002], 'color': 'green'}, {'coordinates': [40.60008237240675, -74.17196392064943], 'color': 'green'}, {'coordinates': [40.83211308171965, -73.92069553875987], 'color': 'green'}, {'coordinates': [40.84777267302635, -73.89056725085115], 'color': 'green'}, {'coordinates': [40.55598140484815, -74.18904757331794], 'color': 'green'}, {'coordinates': [40.89091139834255, -73.8185322254578], 'color': 'red'}]

    # Create an instance of the model
    model = TornadoDisaster(agents)
    
    for i in range(10):  
        print("Safe : {}".format(number_safe(model)))
        print("Injured : {}".format(number_injured(model)))
        print("Dead : {}".format(number_killed(model)))
        print()

        model.step()
