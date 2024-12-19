import { HeaderView } from "./ui/header/index.js";
import { Candidats } from "./data/data-candidats.js";
import { Lycees } from "./data/data-lycees.js";
import { Postal } from "./data/data-postal.js";
import { MapComponent } from './ui/map/index.js';
import { ChartComponent } from './ui/chart/index.js';

let C = {};

C.init = async function() {
    V.init();
};

let V = {
    header: document.querySelector("#header"),
};

V.init = function() {
    V.renderHeader();
    let candidats = Candidats.getAll();
    let lycees = Lycees.getAll();
    let postal = Postal.getAll();
    
    // Initialisation de la carte avec les données
    MapComponent.init(candidats, lycees, postal);

    // Initialisation du graphique avec les données
    ChartComponent.init(candidats, lycees); // Ajouter cette ligne
};

V.renderHeader = function() {
    V.header.innerHTML = HeaderView.render();
};

C.init();