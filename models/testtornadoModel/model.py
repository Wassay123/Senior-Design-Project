import pygame
import sys
import random
import numpy as np

class individual_person:
    def __init__(self, number, position, next_city, speed, current_city):
        self.number = number
        self.position = position
        self.next_city_index = next_city
        self.is_person_moving = False
        self.person_moving_speed = speed
        self.moves_remaining = speed
        self.x_increment = 0
        self.y_increment = 0
        self.current_city_index = current_city
        self.hit_by_tornado = False
        self.alive = True

        # person is green by default
        self.color = (0, 255, 0)

class TornadoSimulation:
    def __init__(self, width=700, height=700):
        pygame.init()

        self.WIDTH = width
        self.HEIGHT = height
        self.simulation_started = False

        self.WHITE = (255, 255, 255)
        self.RED = (255, 0, 0)
        self.BLACK = (0, 0, 0)
        self.BLUE = (0, 0, 255)
        self.GREEN = (0, 255, 0)

        self.screen = pygame.display.set_mode((self.WIDTH, self.HEIGHT))
        self.surface = pygame.Surface((self.WIDTH, self.HEIGHT), pygame.SRCALPHA)
        pygame.display.set_caption("Tornado Simulation")

        self.TORNADO_RADIUS = 10
        self.TORNADO_SPEED = 3

        self.BUTTON_WIDTH = 100
        self.BUTTON_HEIGHT = 25
        self.BUTTON_COLOR = (0, 255, 0)
        self.BUTTON_TEXT_COLOR = (255, 255, 255)
        self.BUTTON_FONT_SIZE = 30
        self.VERTICAL_BUTTON_OFFSET = 60
        self.HORIZONTAL_BUTTON_OFFSET = 60

        self.is_program_reset = True

        # size of red warning cone
        self.cone_offset = 50
        # upper and lower bounds of person evacuation speed
        self.min_steps_to_next_city, self.max_steps_to_next_city = 80, 150
        # radius where people get hit by tornado
        self.tornado_hit_radius = 30
        # evacuation radius
        self.evacuation_radius = 100

        self.font = pygame.font.SysFont(None, self.BUTTON_FONT_SIZE)

        self.tornado_x = 0
        self.random_y_offset = random.random()
        self.tornado_y = 5+self.cone_offset + (self.HEIGHT-2*(5+self.cone_offset)) * self.random_y_offset

        self.vertical_starting_point = self.tornado_y

        self.tornado_positions = []
        self.first_layer_damage_positions = []
        self.second_layer_damage_positions = []
        self.third_layer_damage_positions = []

        self.clock = pygame.time.Clock()

        self.tornado_running = False
        self.cities = [[67, 625], [180, 515], [350, 475], [450, 300], [475, 100], [590, 420], [620, 300]]
        self.people_distance_from_city = 20

        self.people_positions = np.array([[(x+self.people_distance_from_city, y+self.people_distance_from_city),
                                  (x+self.people_distance_from_city, y-self.people_distance_from_city), 
                                  (x-self.people_distance_from_city, y-self.people_distance_from_city), 
                                  (x-self.people_distance_from_city, y+self.people_distance_from_city)] for (x,y) in self.cities])
        self.people_positions = np.reshape(self.people_positions, (-1, 2))

        

        self.next_city_index_dict_if_tornado_above = {0:[0, 2, 3, 5, 6, 4],
                                                      1:[0, 2, 5, 6, 3, 4],
                                                      2:[5, 6, 1, 0, 3, 4],
                                                      3:[5, 6, 2, 1, 0, 4],
                                                      4:[6, 5, 3, 2, 1, 0],
                                                      5:[2, 1, 0, 6, 3, 4],
                                                      6:[5, 2, 1, 0, 3, 4]}
        
        self.next_city_index_dict_if_tornado_below = {0:[1, 2, 5, 3, 6, 4],
                                                      1:[2, 5, 3, 6, 4, 0],
                                                      2:[5, 3, 6, 4, 1, 0],
                                                      3:[4, 6, 5, 2, 1, 0],
                                                      4:[4, 6 ,5, 3, 2, 1],
                                                      5:[6, 3, 4, 2, 1, 0],
                                                      6:[4, 3, 5, 2, 1, 0]}

        self.people_objects = [individual_person(i, position, self.next_city_index_dict_if_tornado_above[i//4][0], random.randint(self.min_steps_to_next_city, self.max_steps_to_next_city), i//4) for i, position in enumerate(self.people_positions)]
        self.hit_cities = [False for _ in self.cities]
        self.people_size = 5

        self.background_image = pygame.image.load('static/images/nyc_basemap.jpg').convert()
        self.move_counter = 0

        self.num_of_deaths = 0
        self.num_alive = len(self.people_objects)
                

    def draw_buttons(self):
        # start button
        pygame.draw.rect(self.surface, self.BUTTON_COLOR, (self.WIDTH // 3-self.BUTTON_WIDTH // 2 + self.HORIZONTAL_BUTTON_OFFSET, self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + self.BUTTON_HEIGHT, self.BUTTON_WIDTH, self.BUTTON_HEIGHT))
        text = self.font.render("Start", True, self.BUTTON_TEXT_COLOR)
        text_rect = text.get_rect(center=(self.WIDTH // 3 + self.HORIZONTAL_BUTTON_OFFSET, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT - self.BUTTON_HEIGHT // 2) + 1))
        self.surface.blit(text, text_rect)
        # reset button
        pygame.draw.rect(self.surface, self.BUTTON_COLOR, (self.WIDTH-self.WIDTH // 3 - self.BUTTON_WIDTH // 2 - self.HORIZONTAL_BUTTON_OFFSET, self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + self.BUTTON_HEIGHT, self.BUTTON_WIDTH, self.BUTTON_HEIGHT))
        text = self.font.render("Reset", True, self.BUTTON_TEXT_COLOR)
        text_rect = text.get_rect(center=(self.WIDTH-self.WIDTH // 3 - self.HORIZONTAL_BUTTON_OFFSET, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT - self.BUTTON_HEIGHT // 2) + 2))
        self.surface.blit(text, text_rect)

        # death count rectangle
        text = self.font.render("Alive", True, (0, 0, 0))
        text_rect = text.get_rect(center=(self.WIDTH // 3 + self.HORIZONTAL_BUTTON_OFFSET, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT) - 35))
        self.surface.blit(text, text_rect)

        # display alive count
        number_text = self.font.render(str(self.num_alive), True, self.BLACK)
        self.surface.blit(number_text, ((self.WIDTH // 3 + self.HORIZONTAL_BUTTON_OFFSET-12, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT) - 22)))

        # alive count rectangle
        text = self.font.render("Deaths", True, (0, 0, 0))
        text_rect = text.get_rect(center=(self.WIDTH-self.WIDTH // 3 - self.BUTTON_WIDTH // 2 - 11, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT) - 35))
        self.surface.blit(text, text_rect)

        # display death count
        number_text = self.font.render(str(self.num_of_deaths), True, self.BLACK)
        self.surface.blit(number_text, ((self.WIDTH-self.WIDTH // 3 - self.BUTTON_WIDTH // 2 - 17, self.HEIGHT - (self.VERTICAL_BUTTON_OFFSET - self.BUTTON_HEIGHT) - 22)))
    
    def draw_cone(self):
        
        # top cone line                                   starting point of line                              ending point of line
        pygame.draw.line(self.surface, (255, 0, 0, 200), (0, self.vertical_starting_point-self.cone_offset), (self.WIDTH, self.vertical_starting_point-self.cone_offset), 5)
        # bottom cone line
        pygame.draw.line(self.surface, (255, 0, 0, 200), (0, self.vertical_starting_point+self.cone_offset), (self.WIDTH, self.vertical_starting_point+self.cone_offset), 2)
        # middle of the cone
        pygame.draw.rect(self.surface, (255, 0, 0, 80), [0, self.vertical_starting_point-self.cone_offset, self.WIDTH, 2*self.cone_offset])
        
    def move_tornado(self):
        self.move_counter += 1
        if self.move_counter % 2 == 0:
            self.tornado_x += self.TORNADO_SPEED
            if self.tornado_y <= 15:
                offset = random.uniform(1, 10) 
            elif self.tornado_y > self.HEIGHT - 15:
                offset = random.uniform(-10, -1) 
            else:
                offset = random.uniform(-10, 10)
            self.tornado_y += offset
            self.tornado_positions.append((self.tornado_x, self.tornado_y))

    def evacuate_people(self):
        if self.simulation_started:
            for person in self.people_objects:
                person_x, person_y = person.position
                x_difference = person_x-self.tornado_x
                y_difference = person_y-self.tornado_y
                
                if -self.evacuation_radius < x_difference < self.evacuation_radius and -self.evacuation_radius < y_difference < self.evacuation_radius:
                    did_point_start_moving = person.is_person_moving

                    if not did_point_start_moving:
                        # city 1, 2, 3, 6 go by whether the tornado is above or below the person
                        if person.current_city_index != 0 and person.current_city_index != 5 and person.current_city_index != 4:
                            
                            # tornado is above the person
                            if y_difference > 0:

                                # find best city to evacuate to that is not already hit
                                for city_index in self.next_city_index_dict_if_tornado_above[person.current_city_index]:
                                    if self.hit_cities[city_index] == False:
                                        person.next_city_index = city_index
                                        break

                            # tornado is below the person
                            else:
                                # find best city to evacuate to that is not already hit
                                for city_index in self.next_city_index_dict_if_tornado_below[person.current_city_index]:
                                    if self.hit_cities[city_index] == False:
                                        person.next_city_index = city_index
                                        break

                        # if its city 0, 5, 4 go by whether the tornado is to the left or right of the person
                                
                        # if tornado is to the left
                        elif x_difference >= 0:
                            # tornado to the left and above
                            if y_difference >= 0:
                                if person.current_city_index == 0:
                                    # find best city to evacuate to that is not already hit
                                    for city_index in self.next_city_index_dict_if_tornado_below[person.current_city_index]:
                                        if self.hit_cities[city_index] == False:
                                            person.next_city_index = city_index
                                            break
                                else:
                                    # find best city to evacuate to that is not already hit
                                    for city_index in self.next_city_index_dict_if_tornado_above[person.current_city_index]:
                                        if self.hit_cities[city_index] == False:
                                            person.next_city_index = city_index
                                            break
                            
                            # tornado to the left and below
                            else:
                                if person.current_city_index == 4:
                                    # find best city to evacuate to that is not already hit
                                    for city_index in self.next_city_index_dict_if_tornado_above[person.current_city_index]:
                                        if self.hit_cities[city_index] == False:
                                            person.next_city_index = city_index
                                            break
                                else:
                                    # find best city to evacuate to that is not already hit
                                    for city_index in self.next_city_index_dict_if_tornado_below[person.current_city_index]:
                                        if self.hit_cities[city_index] == False:
                                            person.next_city_index = city_index
                                            break

                                
                        # if tornado is to the right
                        else:
                            # tornado to the right and above
                            if y_difference >= 0:
                                # find best city to evacuate to that is not already hit
                                for city_index in self.next_city_index_dict_if_tornado_above[person.current_city_index]:
                                    if self.hit_cities[city_index] == False:
                                        person.next_city_index = city_index
                                        break
                            # tornado to the right and below
                            else:
                                # find best city to evacuate to that is not already hit
                                for city_index in self.next_city_index_dict_if_tornado_below[person.current_city_index]:
                                    if self.hit_cities[city_index] == False:
                                        person.next_city_index = city_index
                                        break

                            

                        destination_city = self.cities[person.next_city_index].copy()
                        # assign a little bit of randomness so everybody does not go to the same point
                        destination_city[0] += random.randint(-10, 10)
                        destination_city[1] += random.randint(-10, 10)
                        
                        horizontal_distance_to_city = person_x-destination_city[0]
                        vertical_distance_to_city = person_y-destination_city[1]

                        person_x_step = horizontal_distance_to_city / person.person_moving_speed
                        person_y_step = vertical_distance_to_city / person.person_moving_speed
                        
                        person.is_person_moving = True
                        person.x_increment = person_x_step
                        person.y_increment = person_y_step
                        
                        person.current_city_index = person.next_city_index
                            
            self.move_to_nearest_city()
            
    def move_to_nearest_city(self):
    
        for person in self.people_objects:
            if person.alive:
                is_person_moving = person.is_person_moving
                if is_person_moving:
                    
                    new_x = person.position[0] - person.x_increment
                    new_y = person.position[1] - person.y_increment
                    person.position = [new_x, new_y]

                    person.moves_remaining -= 1
                    if person.moves_remaining <= 0:
                        person.is_person_moving = False
                        person.moves_remaining = person.person_moving_speed
             

    def reset_visuals(self):
        
        self.tornado_running = False

        self.tornado_x = 0
        self.random_y_offset = random.random()
        self.tornado_y = 5+self.cone_offset + (self.HEIGHT-2*(5+self.cone_offset)) * self.random_y_offset
        self.vertical_starting_point = self.tornado_y

        self.tornado_positions = []
        self.hit_cities = [False for _ in self.cities]
        self.simulation_started = False
        self.is_program_reset = True
        self.num_of_deaths = 0
        self.num_alive = len(self.people_objects)

        for i, person in enumerate(self.people_objects):
            person.position = self.people_positions[i]
            person.next_city_index = self.next_city_index_dict_if_tornado_above[i//4][0]
            person.is_person_moving = False
            person.person_moving_speed = random.randint(self.min_steps_to_next_city, self.max_steps_to_next_city)
            person.moves_remaining = person.person_moving_speed
            person.current_city_index = i//4
            person.hit_by_tornado = False
            person.alive = True
            person.color = (0, 255, 0)
        
    def start_simulation(self):
        if self.is_program_reset:
            self.tornado_running = True
            self.simulation_started = True
            self.is_program_reset = False

    def tornado_too_close_detection(self):
        for person in self.people_objects:
            person_x, person_y = person.position
            x_distance_from_tornado = np.abs(person_x-self.tornado_x)
            y_distance_from_tornado = np.abs(person_y-self.tornado_y)

            diagonal_distance_from_tornado = (x_distance_from_tornado**2 + y_distance_from_tornado**2)**(1/2)
            if diagonal_distance_from_tornado <= self.tornado_hit_radius:
                person.color = (50, 50, 50)
                person.alive = False
        
        self.num_of_deaths = np.sum([person.alive == False for person in self.people_objects])
        self.num_alive = len(self.people_objects) - self.num_of_deaths

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_x, mouse_y = pygame.mouse.get_pos()
                    if (self.WIDTH // 3 - self.BUTTON_WIDTH // 2 + self.HORIZONTAL_BUTTON_OFFSET <= mouse_x <= self.WIDTH // 3 + self.BUTTON_WIDTH // 2 + self.HORIZONTAL_BUTTON_OFFSET) and \
                       (self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + self.BUTTON_HEIGHT <= mouse_y <= self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + 2*self.BUTTON_HEIGHT):
                        self.start_simulation()

                    elif (self.WIDTH-self.WIDTH // 3 - self.BUTTON_WIDTH // 2 - self.HORIZONTAL_BUTTON_OFFSET <= mouse_x <= self.WIDTH-self.WIDTH // 3 + self.BUTTON_WIDTH // 2 - self.HORIZONTAL_BUTTON_OFFSET) and \
                       (self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + self.BUTTON_HEIGHT <= mouse_y <= self.HEIGHT - self.VERTICAL_BUTTON_OFFSET + 2*self.BUTTON_HEIGHT):
                        self.reset_visuals()

            if self.tornado_running:
                self.move_tornado()

                if self.tornado_x >= self.WIDTH:
                    self.tornado_running = False

            # detect if people are too close to tornado
            self.tornado_too_close_detection()

            # move the people within range of the tornado
            self.evacuate_people()
            
            # add background
            self.screen.blit(self.background_image, (0, 0))

            # draw warning cone before everything else
            self.draw_cone()
            
            # cities, blue dots
            for i, city in enumerate(self.cities):
                if self.hit_cities[i]:
                    pygame.draw.circle(self.screen, self.BLACK, (city[0], city[1]), 15)

                elif np.abs(city[1]-self.tornado_y) <= 18 and np.abs(city[0]-self.tornado_x) <= 18:
                    self.hit_cities[i] = True
                    pygame.draw.circle(self.screen, self.BLACK, (city[0], city[1]), 15)
                
                else:
                    pygame.draw.circle(self.screen, self.BLUE, (city[0], city[1]), 15)

                # putting the city number on the city dot
                font = pygame.font.Font(None, 24)
                text_surface = font.render(str(i), True, (255, 255, 255))
                text_rect = text_surface.get_rect(center=city)
                self.screen.blit(text_surface, text_rect)

            # people, green dots
            for i, person in enumerate(self.people_objects):
                person_x, person_y = person.position
                pygame.draw.circle(self.screen, person.color, (person_x, person_y), self.people_size)
                
            # tornado path, black dots
            for pos in self.tornado_positions:
                tornado_x, tornado_y = pos
                pygame.draw.circle(self.surface, self.BLACK, (tornado_x, tornado_y), 5)
    
            # tornado, big red dot
            pygame.draw.circle(self.surface, self.RED, (self.tornado_x, self.tornado_y), self.TORNADO_RADIUS)
            
            
            self.draw_buttons()

            # put the surface on the screen
            self.screen.blit(self.surface, (0, 0))            

            # update the window
            pygame.display.flip()

            # reset the surface
            self.surface.fill((0, 0, 0, 0))
        
            self.clock.tick(60)

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    simulation = TornadoSimulation()
    simulation.run()
