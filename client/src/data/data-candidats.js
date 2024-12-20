let data = await fetch("./src/data/json/candidatures.json");
data = await data.json();

let Candidats = {}

Candidats.getAll = function() {
    return data;
}

// Fonction pour préparer les données des candidats pour le graphique
Candidats.prepareChartData = function(candidats) {
    let departments = {};

    candidats.forEach((cand) => {
        if (cand.Scolarite && cand.Scolarite.length > 0) {
            let cp = cand.Scolarite[0]?.CommuneEtablissementOrigineCodePostal;
            if (cp) {
                let dep = this.adjustPostalCode(cp);

                if (!departments[dep]) {
                    departments[dep] = { general: 0, sti2d: 0, autres: 0, total: 0 };
                }

                // Catégorisation des candidatures en fonction du Bac
                switch (cand.Baccalaureat?.SerieDiplomeCode) {
                    case 'Générale':
                        departments[dep].general++;
                        break;
                    case 'STI2D':
                        departments[dep].sti2d++;
                        break;
                    default:
                        departments[dep].autres++;
                        break;
                }

                departments[dep].total++;
            }
        }
    });

    return departments;
}

// Fonction pour ajuster le code postal (ex : 45100 → 45000)
Candidats.adjustPostalCode = function(cp) {
    let departmentCode = cp.slice(0, 2);
    let cityCode = cp.slice(2, 5);
    if (parseInt(cityCode) > 100) {
        return departmentCode + '00'; // Regrouper par département
    } else {
        return cp.slice(0, 5); // Récupérer uniquement le code du département
    }
}

export { Candidats };
