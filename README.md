## How to edit/use
App.py is the main file that controls the deployment of the project.

- **app.py** If you want to run the project this is the file you need to run. This file is executed with the python3 app.py command. It deploys on a local server with the address 127.0.0.1:5000. You can press CTRL+C in the terminal to quit the simulation and website. This file mainly just controls deployment and connecting the pieces together with websockets.

- **index.html** This file contains the HTML code for the website that 'app.py' runs.

- **static folder** This folder includes two subfolders. Scripts which holds all the javascript files, and styles, which contains the CSS file referred to by the HTML.

- **model.py** This file contains the main model code that utilizes Mesa for simulation. You can adjust parameters in the 'VirusOnNetwork' class constructor to edit the model. Each individual agent in the model is represented by the 'VirusAgent' class. You can also add additional data collection in the 'DataCollector' class, which is constructed within the model class. You can adjust parameters in the website, but if you want to change the available ranges, you can do so in this file.