let data = await fetch("./src/data/json/lycees.json");
data = await data.json();

let Lycees = {}

Lycees.getAll = function() {
    return data;
}

// Fonction pour associer un candidat à son lycée via le code UAI
Lycees.getLyceeByUAI = function(candidats, lycees) {
    let markers = {};

    for (let cand of candidats) {
        let UAI;
        for (let annee of cand.Scolarite) {
            if (annee.UAIEtablissementorigine) {
                UAI = annee.UAIEtablissementorigine;
                break;
            }
        }

        let lycee = lycees.find(l => l.numero_uai === UAI);
        if (lycee) {
            if (!lycee.candidats) {
                lycee.candidats = [];
            }
            lycee.candidats.push(cand);
            markers[lycee.numero_uai] = lycee;
        }
    }

    return markers;
}

export { Lycees };
