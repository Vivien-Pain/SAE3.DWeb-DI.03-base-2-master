import { HeaderView } from "./ui/header/index.js";
import { Candidats } from "./data/data-candidats.js";
import { Lycees } from "./data/data-lycees.js";
import './index.css';
import { MapComponent } from './ui/map/index.js';

let C = {};

C.init = async function() {
    V.init();
    console.log(Candidats.getAll());
    console.log(Lycees.getAll());
};

let V = {
    header: document.querySelector("#header"),
};

V.init = function() {
    V.renderHeader();
    let candidats = Candidats.getAll();
    let lycees = Lycees.getAll();
    MapComponent.init(candidats, lycees); // Initialisation de la carte avec les données
};

V.renderHeader = function() {
    V.header.innerHTML = HeaderView.render();
};

C.init();