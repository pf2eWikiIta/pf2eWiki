let links = [];
let struttura;
let listaTratti;

export let input;
export let suggestionsBox;
let dataset = [];
export async function init() {
  const res = await fetch('struttura.json');
  struttura = await res.json();
  const res2 = await fetch('linkSpeciali.json');
  links = await res2.json();
  const res3 = await fetch('./data/regole/tratti.json');
  listaTratti = await res3.json();
  console.log('Struttura caricata:', struttura);
}

export function vR(testo) {
  return `(${testo})[${testo}]`;
}

function creaLink(percorso) {
  switch(percorso.length) {
    case 1:
      return `./${percorso[0]}.html`;
    case 2:
      return `./${percorso[0]}.html?sezione=${percorso[1]}`;
    case 3:
      for(let i = 0; i < links.length; i++) {
        if(percorso[1] == links[i])
          return `./${percorso[1]}Visualizzazione.html?id=${percorso[2]}`;
      }
      return `./${percorso[0]}.html?sezione=${percorso[1]}&id=${percorso[2]}`;
    default:
      console.log("wtf");
  }
}

export function creaTabella(dati, nomeColonne, linkAutomatici = false, ordinare = false, idTabella = null) {
  let risultato = creaGrafica(nomeColonne, dati, linkAutomatici,ordinare);
  if(idTabella != null) {
    const container = document.getElementById(idTabella);
    if (container) render(container, risultato, true);
  } else return risultato;
  
}

export async function trovaDati(nomeFile, datiRicercati) {
  try {
    let path = `./data/${nomeFile}`;
    const response = await fetch(path);
    if (!response.ok) throw new Error('Errore nella richiesta');

    const data = await response.json();
    let dati = [];
    for(let i = 0; i < datiRicercati.length; i++) {
      dati[i] = data.map(obj => obj[datiRicercati[i]]);
    }
    return dati;
  } catch (error) {
    console.log('Errore: ' + error.message);
  }
}

function creaGrafica(colonne, dati, linkAutomatici, ordinare) {
  let risultato = '<table class="table table-dark table-striped"><thead><tr>';
  for(let i = 0; i < colonne.length; i++) {
    risultato += `<th>${colonne[i]}</th>`;
  }
  risultato += '</tr></thead><tbody>';
  if(ordinare)
    for(let i = 0; i < dati[0].length-1; i++)
      for(let j = i+1; j < dati[0].length; j++)
        if(dati[0][i] > dati[0][j])
          for(let k = 0; k < colonne.length; k++) {
            let temp = dati[k][i];
            dati[k][i] = dati[k][j];
            dati[k][j] = temp;
          }

  for(let i = 0; i < dati[0].length; i++) {
    risultato += '<tr>';
    risultato += `<td>${controllaTesto(linkAutomatici? vR(dati[0][i]) : dati[0][i])}</td>`;
    for(let j = 1; j < colonne.length; j++) {
      risultato += `<td>${controllaTesto(dati[j][i])}</td>`;
    }
    risultato += '</tr>';
  }
  risultato += '</tbody></table>';
  return risultato;
}

export function creaHtmlLink(testo) {
  let pos;
  let iT;
  let iQ;
  while(testo.indexOf(")[") != -1) {
    pos = testo.indexOf(")[");
    iT = testo.lastIndexOf("(", pos);
    iQ = testo.indexOf("]", pos);
    testo = `${testo.substring(0, iT)}<a href='${restituisciLink(testo.substring(pos + 2, iQ))}'>${testo.substring(iT + 1, pos)}</a>${testo.substring(iQ + 1)}`;
  }
  return testo;
}

export function restituisciLink(elementoCercato) {
  return creaLink(trovaElemento(elementoCercato));
}

function trovaElemento(nomeCercato, arrayAn = struttura, percorso = []) {
  
  for(let i = 0; i < arrayAn.length; i++) {
    let p = [...percorso];
    if(arrayAn[i].tipo == "directory") {
      p.push(arrayAn[i].nome);
      if(arrayAn[i].nome == nomeCercato) return p;
      let risultato = trovaElemento(nomeCercato, arrayAn[i].sottofile, p);
      if(risultato) return risultato;
    } else {
      let nomeF = arrayAn[i].nome.replace(".json", "");
      p.push(nomeF);
      if(nomeF == nomeCercato) return p;
      for(let j = 0; j < arrayAn[i].contenuto.length; j++) {
        if(arrayAn[i].contenuto[j].nome.toLowerCase() == nomeCercato.toLowerCase()) {
          p.push(arrayAn[i].contenuto[j].nome);
          return p;
        }
      }
    }
  }
}

export async function restituisciDatoAttributi(path, attributi, valore) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Errore nella richiesta');

    const data = await response.json();
    return data.filter(el => attributi.every((attr, i) => {if(Array.isArray(el[attr])) { for(let j = 0 ; j < el[attr].length; j++) if(el[attr][j] == valore[i]) return el[attr][j] == valore[i]; return false} else return el[attr] == valore[i]}));
  } catch (error) {
    return { Nome: error.message };
  }
}

export async function restituisciOggetto(path, nomeCercato) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Errore nella richiesta');
    const data = await response.json();
    return data.find(obj => obj.Nome === nomeCercato) || null;
  } catch (error) {
    return { Nome: error.message };
  }
}

export function cercaAzioni(testo) {
  while(testo.includes("###")) {
    let start = testo.indexOf("###");
    let end = testo.indexOf("###", start + 1);
    testo = testo.substring(0, start) + creaAzione(testo.substring(start + 3, end)) + testo.substring(end + 3);
  }
  return testo;
}

function creaAzione(testo) {
  let ogg = JSON.parse(testo);
  let risultato = `
    <div class="card mb-3">
      <div class="card-body">
        <strong>${ogg.nome}
        ${Array.isArray(ogg.tipoAzz)? mettiImmaginiAzioni(`da [[${ogg.tipoAzz[0]}]] a [[${ogg.tipoAzz[1]}]]`): mettiImmaginiAzioni(`[[${ogg.tipoAzz}]]`)}</strong><br>
        ${creaGraficaTratti(ogg.tratti)}`;
  for(let chiave in ogg.dettagli) {
    risultato += `<strong>${chiave}:</strong> ${ogg.dettagli[chiave]}<br>`;
  }
  risultato += `<br>${ogg.desc}</div></div>`;
  return risultato;
}

 function resetPopover(root = document) {
  root.querySelectorAll?.('[data-bs-toggle="popover"]').forEach(el => {
    bootstrap.Popover.getOrCreateInstance(el);
  });
}

export function aggiornaUrl(path) {
  window.location.href = path; 
}

export function controllaTesto(testo) {
  return mettiImmaginiAzioni(cercaAzioni(creaHtmlLink(cercaACapo(trovaTitolo(chiamaStringFunc(trovaGrassetto(cercaTratti(testo))))))));
}

function mettiImmaginiAzioni(testo) {
  let iS;
  let iF;
  let nomeIm;
  while(testo.includes("[[")) {
    iS = testo.indexOf("[[");
    iF = testo.indexOf("]]", iS);
    nomeIm = testo.substring(iS + 2, iF);
    testo = `${testo.substring(0, iS)}<img src="./immagini/${nomeIm}.png" alt="${nomeIm}" width="45" height="45"></img>${testo.substring(iF + 2)}`;
  }
  return testo;
}

export function aprireSidebar(posSidebar) {
  let percorso = trovaElemento(posSidebar);
  document.querySelectorAll('.btn.btn-sm.btn-outline-secondary.ms-2').forEach(btn => {
    if(btn.dataset.contenuto == percorso[0]) {
      let id = btn.getAttribute('href').replace("#", "");
            
      const el = document.getElementById(id);
            
      let instance = bootstrap.Collapse.getOrCreateInstance(el);
      instance.toggle();
      if(percorso.length == 3) {
        document.querySelectorAll('.btn.btn-sm.btn-outline-secondary.ms-2').forEach(btn => {
          if(btn.dataset.contenuto == percorso[1]) {
            let id = btn.getAttribute('href').replace("#", "");
                  
            const el = document.getElementById(id);
              
            let instance = bootstrap.Collapse.getOrCreateInstance(el);
            instance.toggle();
          }
        });
      }
    }
  });
}

function cercaACapo(testo) {
  let split = testo.split("@");
  return split.length == 1? testo : split.join("<br>");
}

function trovaGrassetto(testo) {
  let i = 0;
  while(testo.indexOf("++", i) != -1) {
    i = testo.indexOf("++", i);
    let iCh = testo.indexOf("++", i+1);
    testo = `${testo.substring(0, i)} <strong>${testo.substring(i+2, iCh)}</strong>${testo.substring(iCh+2)}`;
    i = iCh + 1;
  }
  return testo;
}

function trovaTitolo(testo) {
  let i = 0;
  while(testo.indexOf("--", i) != -1) {
    i = testo.indexOf("--", i);
    let iCh = testo.indexOf("--", i+1);
    testo = `${testo.substring(0, i)} <h3>${testo.substring(i+2, iCh)}</h3>${testo.substring(iCh+2)}`;
    i = iCh + 1;
  }
  return testo;
}

export function chiamaStringFunc(testo) {
  let iP = 0;
  let pos = [];

  while(testo.indexOf("==", iP) != -1) {
    let ind = testo.indexOf("==", iP);
    pos.push(ind);
    iP = ind + 1;
  }
  
  let testoNuovo = '';

  if(pos.length == 0)
    return testo;
  else
    testoNuovo = testo.substring(0, pos[0]);

  for(let i = 0; i < pos.length; i += 2) {
    testoNuovo += eval(testo.substring(pos[i] + 2, pos[i+1]));
    if(i + 2 < pos.length) testoNuovo += testo.substring(pos[i + 1] + 2, pos[i + 2]);
  }
  testoNuovo += testo.substring(pos[pos.length-1] + 2);
  return testoNuovo;
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function creaCopiaAzione(oggOr, grandezza = 14) {
  let ogg = JSON.parse(oggOr.replaceAll("###",""));
  let det = "";
  for (const key in ogg.dettagli)
    det += `++${key}:++ ${ogg.dettagli[key]}@`;
  det += "@";
  return controllaTestoIncolla(`++{{${grandezza}${ogg.nome}}}++ ${Array.isArray(ogg.tipoAzz)? `da [[${ogg.tipoAzz[0]}]] a [${ogg.tipoAzz[1]}]`:`[[${ogg.tipoAzz}]]`}//${ogg.tratti.join(";")}//${det}${ogg.desc}`);
}

export async function aprireIncantesimo(tradizione, id) {
    let path = `./data/incantesimi/${tradizione}.json`;
    let dati = await restituisciOggetto(path, id);
    let info = [];
    if(dati.Azione) {
      let ogg = JSON.parse(dati.Desc.replaceAll("###", ""));
      info.push(`${Array.isArray(ogg.tipoAzz)? mettiImmaginiAzioni(`da [[${ogg.tipoAzz[0]}]] a [[${ogg.tipoAzz[1]}]]`): mettiImmaginiAzioni(`[[${ogg.tipoAzz}]]`)}`);
      info.push(creaGraficaTratti(ogg.tratti));
      let det = "";
      for (const key in ogg.dettagli)
        det += `++${key}:++ ${ogg.dettagli[key]}@`;
      det += "@";
      info.push(controllaTesto(det));
      info.push(controllaTesto(ogg.desc));
      info.push(creaCopiaAzione(dati.Desc));
    } else {
      info.push("");
      info.push(creaGraficaTratti(dati.Tratti));
      info.push(controllaTesto(dati.Dettagli.join("<br>")) + "<br>");
      info.push(controllaTesto(dati.Desc));
      info.push(`++{{14${dati.Nome}}}++//${dati.Tratti.join(";")}//${dati.Dettagli.join("@")}@${controllaTestoIncolla(dati.Desc)}`)
    }
    return `<style> .bar {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
}

.left {
  text-align: left;
}

.right {
  text-align: right;
}
</style>
<div class="bar">
  <span class="left"><h2>${id} ${info[0]}</h2></span>
  <span class="right">${dati.Liv == 0? "Trucchetto": `Livello ${dati.Liv}`}</span>
</div>
${info[1]}
${info[2]}
${info[3]}
<br><br>
${htmlBottoneCopia(info[4])}
`
}


export function controllaTestoIncolla(testo) {
  return aggiungiSlash(copiaAzioniAnnidate(testo)).replaceAll("\\\\\'", "\\'");
}

function aggiungiSlash(testo) {
  let i = 0;
  while(testo.indexOf("'", i) != -1) {
    i = testo.indexOf("'", i);
    testo = `${testo.substring(0, i)}\\${testo.substring(i)}`;
    i = i+4;
  }
  return testo;
}

export function copiaTesto(testo) {
   navigator.clipboard.writeText(testo)
    .then(() => {
      alert("Testo copiato!");
    })
    .catch(err => {
      console.error("Errore nella copia:", err);
    });
}

export function sBInit() {
  render(document.getElementById("navbarNavAltMarkup"),`
    <form class="d-flex w-100" role="search" onsubmit="event.preventDefault(); cerca(document.getElementById('searchBar').value)">
      <div class="w-100 position-relative">
        <input class="form-control me-2" type="search" placeholder="Cerca..." aria-label="Search" id="searchBar" autocomplete="off"/>
        <ul class="list-group" id="suggestions"></ul>
      </div>
    <button class="btn btn-outline-success ms-2" type="submit">Cerca</button>
    </form>`, true);
    input = document.getElementById('searchBar');
    suggestionsBox = document.getElementById('suggestions');
    input.addEventListener('input', () => {
      const query = input.value.trim();
      const suggestions = getSuggestions(query);
      let nuovi = [];
      for(let i = 0; i < suggestions.length && nuovi.length < 3; i++)
          if(!nuovi.includes(suggestions[i]))
            nuovi.push(suggestions[i]);
      showSuggestions(nuovi);
    });
    creaDataset();
}

function creaDataset(arrayAn = struttura) {
  for(let i = 0; i< arrayAn.length; i++)
    if(arrayAn[i].tipo == "directory") {
      creaDataset(arrayAn[i].sottofile);
    } else {
      dataset.push(arrayAn[i].nome.replace(".json", ""));
      for(let j = 0; j < arrayAn[i].contenuto.length; j++) {
        if(arrayAn[i].contenuto[j].mostrare)
          dataset.push(arrayAn[i].contenuto[j].nome);
      }
        
    }
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
      }
    }
  return matrix[a.length][b.length];
}

// Funzione per ottenere i suggerimenti
function getSuggestions(query) {
  if (!query) return [];
    query = query.toLowerCase();

    const results = dataset.map(word => {
      const lowerWord = word.toLowerCase();
      let score;

      if (lowerWord.startsWith(query)) {
        score = 0; // priorità massima
      } else if (lowerWord.includes(query)) {
        score = 1; // priorità media
      } else {
        score = 2 + levenshtein(query, lowerWord); // distanza fuzzy
      }
      return { word, score };
    });
    return results
    .filter(r => r.score < 5) // accettiamo max distanza 3
    .sort((a, b) => a.score - b.score)
    .map(r => r.word);
}

function showSuggestions(suggestions) {
  render(suggestionsBox,'');
  if (!suggestions.length) return;
  suggestions.forEach(s => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'list-group-item-action');
    li.textContent = s;
    li.onclick = () => {
      sBCerca(s);
    };
    suggestionsBox.appendChild(li);
  });
}

function copiaAzioniAnnidate(testo) {
  while(testo.indexOf("###") != -1) {
    let i = testo.indexOf("###");
    let iF = testo.indexOf("###", i + 1);
    testo = testo.substring(0, i) + "@" + creaCopiaAzione(testo.substring(i,iF+3), 12) + "@" + testo.substring(iF+3);
  }
  return testo;
}


export function sBCerca(testo) {
  if(trovaElemento(testo) != null) 
    aggiornaUrl(restituisciLink(testo));
  else
    alert("Input invalido, correggi coglione");
}

export function htmlBottoneCopia(testo) {
  return `<button onclick = "copia('${testo}')" class="copia btn btn-outline-success me-2">Copia</button>`;
}

export function testoCopiaGenerico(ogg) {
  return `${ogg.Nome? `++{{14${ogg.Nome}}}++` : ``}${ogg.Tratti? `//${ogg.Tratti.join(";")}//`:``}${ogg.Dettagli? ogg.Dettagli.join("@")+"@":""}${ogg.Desc? controllaTestoIncolla(ogg.Desc):""}`
}

export async function apriTalento(path, id) {
  let tal = await restituisciOggetto(path, id);
  if(tal.Azione)
    return `<h2>${tal.Nome}&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspLivello ${tal.Liv}</h2>${controllaTesto(tal.Desc)}<br><br> ${htmlBottoneCopia(creaCopiaAzione(tal.Desc))}`;
  else {
    let testo = `++{{14${tal.Nome}}}++//${tal.Tratti.join(";")}//${tal.Dettagli.join("@")}@${controllaTestoIncolla(tal.Desc)}`;
    return `<h2>${tal.Nome}&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspLivello ${tal.Liv}</h2>${creaGraficaTratti(tal.Tratti)}${controllaTesto(controllaTesto(tal.Dettagli.join("<br>")))}<br><br>${controllaTesto(tal.Desc)}<br><br>${htmlBottoneCopia(testo)}`;
  }
    
}

function cercaTratti(testo) {
   let i = 0;
  while(testo.indexOf("//", i) != -1) {
    i = testo.indexOf("//", i);
    let iCh = testo.indexOf("//", i+1);
    testo = `${testo.substring(0, i)}${creaGraficaTratti(testo.substring(i+2, iCh).split("|"))}${testo.substring(iCh+2)}`;
    i = iCh + 1;
  }
  return testo;
}

export function creaGraficaTratti(arr) {
  let testo = `<h5>`;
  for(let i = 0; i < arr.length; i++) {
    
    let nomeTratto = arr[i];

    let desc;
    if(listaTratti.map(p => nomeTratto.toLowerCase().includes(p.Nome.toLowerCase())? "X":"o").includes("X")) {
      let ris = listaTratti.filter(p => nomeTratto.toLowerCase().includes(p.Nome.toLowerCase()));
      desc = ris[0].Desc;
      for(let i = 1; i < ris.length; i++)
        if(nomeTratto == ris[i].Nome)
          desc = ris[i].Desc;
    }
      
    else {
      console.log(nomeTratto);
      desc = "Tratto non trovato, segnalalo";
    }
      
    testo += `<button type="button" class="btn btn-dark" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="bottom" data-bs-content="${desc}">
      ${arr[i]}
    </button>
    `;
  }
    
  testo += `</h5>`;
  return testo;
}

export function render(container, html, aggiungere = false) {
  if (aggiungere) container.innerHTML += html;
  else container.innerHTML = html;

  resetPopover(container); // <<< solo qui dentro
}
