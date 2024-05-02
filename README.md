# Interactive Virus Outbreak and Tornado Modeling Simulation

## Overview

Our work seeks to model and understand the dynamics of natural disasters. Users can witness the impacts of attributes such as wind speed or mortality rate on the overall trajectories and severities of disasters from tornadoes to virus outbreaks. This allows for not only future disaster emulation but also for insights into previous disasters. Our current work is focused on simulating these occurrences in New York City, however, the trends found can be used to understand broad disaster behavior.

The value of this project lies in its ability to deepen our understanding of disasters and their consequences in an intuitive and interesting format. To understand the behaviors of virus spreading, many people generally understand how a disease spreads to people close to you, but not how fast a disease can spread to 100 people from 3 infected people within a set radius. Much logic in our current tornado and virus simulations can be expanded to other disastrous events such as typhoons or flooding for potential future work.

## Usage

Dependencies to install:
- mesa
- flask
- flask-socketio

> [!IMPORTANT]
> **Run 'python3 app.py'**

- It deploys on a local server with the address '127.0.0.1:5000'. You can press 'CTRL+C' in the terminal to quit the simulation and website.
- This file mainly controls deployment and connects the various pieces together with websockets.

## Editing

- 'index.html': This file contains the HTML code for the website that 'app.py' runs.
- 'scripts' folder: Holds all the javascript files.
- 'styles' folder: Contains the CSS file referred to by the HTML.

### Model.py

- Contains the main model code that utilizes Mesa for simulation.
- Adjust parameters in the 'VirusOnNetwork' class constructor to edit the model.
- Each agent in the model is represented by the 'VirusAgent' class.
- Adjust parameters in the website, but these ranges and defaults are able to be changed here
