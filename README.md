# Flask Web App with Mesa Simulation

## Overview

This project is for simulation of disasters such as viruses or tornadoes.

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
