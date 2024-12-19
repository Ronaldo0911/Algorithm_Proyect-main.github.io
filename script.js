const canvas = document.getElementById('canvas');  // manipulacion del lienzo
const ctx = canvas.getContext('2d');              // se utiliza para realizar operaciones de dibujo

let nodes = []; //arreglo de nodos
let edges = [];//arreglo de aristas
let nodeCounter = 1;//contador de nodos

let lost = []; //arreglo para guardar nombres de nodos 
let cEracer = 0; let cRename = 0; //contadores extras



// Contadores de nodo iniciale y final
let nodosFinales = 0;
let nodosIniciale = 0;
let counter;



const graph = {};//representar la estructura del grafo


function addNode(x, y) {//2) agregar nodo
  let node = { name: nodeCounter, x: x, y: y };

  if (cEracer > 0 && cRename < cEracer) {//heredado de nombres
    node.name = lost[cRename];
    lost[cRename] = 0;
    cRename++;

    if (node.name === "I") {
      node.type = "Inicial";
      node.color = '#1900ff';

      // Intercambiar con el nodo en la posición 0
      let tempNode = nodes[0];
      nodes[0] = node;
      node = tempNode;

      drawNodes();
    } else if (node.name === "F") {
      node.type = "Final";
      node.color = '#1900ff';

      // Intercambiar con el nodo en la posición 1
      let tempNode = nodes[1];
      nodes[1] = node;
      node = tempNode;
      drawNodes();
    }


  } else {
    nodeCounter++;
  }

  nodes.push(node);

  drawNode(node);

}

function drawNodes() {//3) redibujar todos los nodos

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawEdges()
  for (let index = 0; index < nodes.length; index++) {


    drawNode(nodes[index]); // Nodo en Cartagena
  }
  
}

function drawNode(node, color = 'blue', radio = 7) {
  // Convertir las coordenadas geográficas a píxeles en el canvas
  const punto = mapa.latLngToContainerPoint([node.x, node.y]);

  // Dibujar el nodo como un círculo
  ctx.beginPath();
  ctx.arc(punto.x, punto.y, radio, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();

  // Dibujar el texto del nombre del nodo
  ctx.font = "9px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(node.name, punto.x, punto.y + 3); // Usar las coordenadas del punto convertido
}

function deleteNode(deleteNode) {//5) borrar nodos y sus aristas

  if (!deleteNode) { deleteNode = document.getElementById('editNode').value; }

  nodes = nodes.filter((node) => node.name !== deleteNode);
  edges = edges.filter((edge) => edge.start !== deleteNode && edge.end !== deleteNode);
  drawNodes();


  let controlador = true;

  for (let x = nodosIniciale; x > 0; x--) {
    if (deleteNode === "I" || deleteNode === "I" + x) { controlador = false; nodosIniciale--; }
  }
  for (let x = nodosFinales; x > 0; x--) {
    if (deleteNode === "F" || deleteNode === "F" + x) { controlador = false; nodosFinales--; }
  }

  if (controlador) {

    if (nodes.length == 0) {//guardado de difuntos
      nodeCounter = 1;
      cEracer = 0
    } else {
      lost[cEracer] = deleteNode;
      cEracer++;
    }

  }


  lost.sort(function (a, b) { return a - b; });
}

function addEdge(nodeS, nodeE) {//7) agregar aristas

  const edge = { start: nodeS, end: nodeE }

  edges.push(edge);

  drawEdge(edge.start, edge.end);

}

function drawEdge(nodeS, nodeE, color = '#888483') {//8)dibujar aristas 

  const nodeStart = nodes.find(node => node.name === nodeS);
  const nodeEnd = nodes.find(node => node.name === nodeE);

  const punto1 = mapa.latLngToContainerPoint([nodeStart.x, nodeStart.y]);
  const punto2 = mapa.latLngToContainerPoint([nodeEnd.x, nodeEnd.y]);
  ctx.beginPath();
  ctx.moveTo(punto1.x, punto1.y);
  ctx.lineTo(punto2.x, punto2.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

}

function drawEdges() {//9) redibujara aristas
  for (let index = 0; index < edges.length; index++) {

    const edge = edges[index];
    drawEdge(edge.start, edge.end);
  }
}

function deleteEdge(EdgeStart, EdgeEnd) {

  const deleteEdgeIndex = edges.findIndex(edge => edge.start === EdgeStart && edge.end === EdgeEnd);


  if (deleteEdgeIndex !== -1) {
    edges.splice(deleteEdgeIndex, 1);
    console.log(`Arista eliminada: Inicio = ${EdgeStart}, Fin = ${EdgeEnd}`);
  } else {
    console.log(`No se encontró la arista con Inicio = ${EdgeStart} y Fin = ${EdgeEnd}`);
  }

  drawNodes();
}

function saveProject() {//14)  Guardar el proyecto
  const data = JSON.stringify({ nodes: nodes, edges: edges });
  const blob = new Blob([data], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(blob);

  // Guardar el archivo JSON
  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = 'Grafo.json';
  jsonLink.click();
  URL.revokeObjectURL(jsonUrl);

  save = 1;
}

function openProject() {//16) abrir proyecto desde archivo JSON
  const input = document.createElement('input');

  console.log(input);

  nodosFinales = 0;
  nodosIniciale = 0;

  input.type = 'file';
  input.accept = 'application/json';
  input.click();

  input.onchange = function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (event) {
      const data = JSON.parse(event.target.result);
      nodes = data.nodes;
      edges = data.edges;

      let max = 0;
      for (const node of nodes) {
        if (node.name > max) {
          max = node.name;
        }
      }
      nodeCounter = max + 1;
      drawNodes();
    };

  };

}







// Algoritmos __________________________________________________________________________________________________________________

function BFS(start, goal) {
  const startTime = performance.now();


  let cola = [];
  let visitados = new Set();
  let resultado = [];
  let cameFrom = {};  // Mapa para guardar el nodo desde el cual llegamos a otro

  cola.push(start);
  visitados.add(start);

  while (cola.length > 0) {

    let actual = cola.shift();

    if (actual === goal) {
      // Reconstruir el camino desde `goal` hacia `start`
      let current = goal;
      while (current !== start) {
        resultado.unshift(current);
        current = cameFrom[current];
      }
      resultado.unshift(start); // Agregar el nodo de inicio

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(resultado, "result");
      Writing(executionTime, "time");
      return resultado;
    }

    // Considerar aristas en ambas direcciones (start -> end y end -> start)

    for (let edge of edges) {

      if ((edge.start === actual || edge.end === actual)) {
        
        let neighbor = (edge.start === actual) ? edge.end : edge.start;
        
        if (!visitados.has(neighbor)) {
          visitados.add(neighbor);
          cameFrom[neighbor] = actual;  // Guardar de qué nodo venimos
          cola.push(neighbor);
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  Writing(" ", "NAN");
  Writing(executionTime, "time");
  return [];
}

function DFS(start, goal) {
  const startTime = performance.now();

  let visited = new Set();
  let stack = [];
  let result = [];

  stack.push(start);

  while (stack.length > 0) {
    let current = stack.pop();

    if (!visited.has(current)) {
      visited.add(current);
      result.push(current);

      if (current === goal) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        Writing(result, "result");
        Writing(executionTime, "time");

        return result;
      }

      // Considerar aristas en ambas direcciones (start -> end y end -> start)
      let neighbors = edges
        .filter(edge => (edge.start === current || edge.end === current))
        .map(edge => (edge.start === current) ? edge.end : edge.start)
        .sort((a, b) => b - a);

      for (let neighbor of neighbors) {
        stack.push(neighbor);
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  Writing(" ", "NAN");
  Writing(executionTime, "time");

  return [];
}

function IDS(start, target) {
  const startTime = performance.now();

  function DLS(node, depth, visited) {
    if (depth === 0) return [];
    if (node === target) return [node];

    visited.add(node);

    let neighbors = edges
      .filter(edge => (edge.start === node || edge.end === node))
      .map(edge => (edge.start === node) ? edge.end : edge.start);

    for (let neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        let path = DLS(neighbor, depth - 1, visited);
        if (path.length > 0) {
          return [node, ...path];
        }
      }
    }

    return [];
  }

  // Bucle principal de IDS
  for (let depth = 1; depth <= nodes.length; depth++) {
    let visited = new Set(); // Reinicia los nodos visitados para cada nivel
    let path = DLS(start, depth, visited);

    if (path.length > 0) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(path, "result");
      Writing(executionTime, "time");
      return path;
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  Writing(" ", "NAN");
  Writing(executionTime, "time");

  return [];
}


function BFS_H(start, goal) {
  const startTime = performance.now();

  function heuristic(node, goal) {
    return Math.abs(node - goal);
  }

  let priorityQueue = [];
  let visited = new Set();
  let result = [];

  priorityQueue.push({ name: start, h: heuristic(start, goal) });
  visited.add(start);

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.h - b.h);
    let current = priorityQueue.shift();

    result.push(current.name);

    if (current.name === goal) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(result, "result");
      Writing(executionTime, "time");

      return result;
    }

    // Considerar aristas en ambas direcciones (start -> end y end -> start)
    for (let edge of edges) {
      let neighbor = (edge.start === current.name) ? edge.end : edge.start;
      
      // Asegurarse de no volver a visitar un nodo
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        priorityQueue.push({ name: neighbor, h: heuristic(neighbor, goal) });
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  Writing(" ", "NAN");
  Writing(executionTime, "time");
  return [];
}

function IDA_SS(start, target) {
  const startTime = performance.now();

  // Heurística para estimar la distancia
  function heuristic(node) {
    return Math.abs(node - target);
  }

  // Búsqueda de profundidad limitada (DLS)
  function DLS(node, g, fLimit, path, visited) {
    let f = g + heuristic(node); // Calcular la función de evaluación
    if (f > fLimit) return f; // Si el valor de f excede el límite, detener

    if (node === target) { // Si alcanzamos el objetivo, devolver el camino
      path.push(node);
      return true;
    }

    let minLimit = Infinity;
    path.push(node); // Agregar el nodo actual al camino
    visited.add(node); // Marcar el nodo como visitado

    // Recorrer todas las aristas del nodo actual
    for (let edge of edges) {
      // Considerar ambas direcciones de las aristas (bidireccionales)
      if (edge.start === node && !visited.has(edge.end)) {
        let result = DLS(edge.end, g + edge.cost, fLimit, path, visited);
        if (result === true) return true; // Si encontramos el objetivo, retornar el camino
        if (typeof result === "number") minLimit = Math.min(minLimit, result);
      } else if (edge.end === node && !visited.has(edge.start)) {
        let result = DLS(edge.start, g + edge.cost, fLimit, path, visited);
        if (result === true) return true;
        if (typeof result === "number") minLimit = Math.min(minLimit, result);
      }
    }

    path.pop(); // Eliminar el nodo actual del camino
    visited.delete(node); // Desmarcar el nodo como visitado
    return minLimit; // Devolver el límite mínimo encontrado
  }

  let fLimit = heuristic(start); // Establecer el límite inicial basado en la heurística
  let path = []; // Lista para almacenar el camino
  let visited = new Set(); // Conjunto de nodos visitados

  while (true) {
    let result = DLS(start, 0, fLimit, path, visited); // Llamar a DLS

    if (result === true) { // Si encontramos el objetivo, devolver el camino
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(path, "result");
      Writing(executionTime, "time");

      return path;
    }

    if (result === Infinity) { // Si no se encontró solución, devolver vacío
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(" ", "NAN");
      Writing(executionTime, "time");

      return [];
    }

    fLimit = result; // Actualizar el límite para la siguiente iteración
  }
}


function ASS(start, target) {
  const startTime = performance.now();

  function heuristic(node) {
    return Math.abs(node - target);
  }

  let openList = [];
  let closedSet = new Set();
  let gValues = { [start]: 0 };
  let cameFrom = {};

  openList.push({ name: start, f: heuristic(start) });

  while (openList.length > 0) {

  

    openList.sort((a, b) => a.f - b.f);
    let current = openList.shift().name;

    if (current === target) {

      
      let path = [];
      while (current != null) {
        path.unshift(current);
        current = cameFrom[current];
      }
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      Writing(path, "result");
      Writing(executionTime, "time");

      return path;
    }

    closedSet.add(current);


    for (let edge of edges) {
      
      if ((edge.start === current || edge.end === current)) {
        let neighbor = (edge.start === current) ? edge.end : edge.start;
        console.log('if2');

        if (!closedSet.has(neighbor)) {

      
          let tentativeG = gValues[current] + edge.cost;

          if (!(neighbor in gValues) || tentativeG < gValues[neighbor]) {

    

            gValues[neighbor] = tentativeG;
            let fValue = tentativeG + heuristic(neighbor);
            openList.push({ name: neighbor, f: fValue });
            cameFrom[neighbor] = current;
          }
        }
      }
    }
  }

  const endTime = performance.now();
  const executionTime = endTime - startTime;

  Writing(" ", "NAN");
  Writing(executionTime, "time");

  return [];
}


function Writing(Messaje, type) {// Escritura

  let x;
  let y;

  let text = "Recorrido: ";

  if (type == "NAN") {
    ctx.clearRect(0, 0, canvas.width, canvas.height); drawNodes()
    x = 100; y = 550;
    text = "Destino no encontrado"
  } else {

    if (type == "result") {

      ctx.clearRect(0, 0, canvas.width, canvas.height); drawNodes()
      x=100; y = 550;

      for (let index = 0; index < Messaje.length; index++) {
        text += Messaje[index];
        if (index != Messaje.length - 1) { text += " ->" }
      }

    } else if ("time") {
      x = 100; y = 50;
      text = "Tiempo: " + Messaje;
    }
  }

  ctx.font = "17px Georgia";
  ctx.fillStyle = "#000";
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);

}


// Controladores de botones
let listElements = document.querySelectorAll('.list__button--click');
listElements.forEach(listElement => {
  listElement.addEventListener('click', () => {

    listElement.classList.toggle('arrow');

    let height = 0;

    let menu = listElement.nextElementSibling;
    if (menu.clientHeight == "0") {
      height = menu.scrollHeight;
    }

    menu.style.height = `${height}px`;
  })
});

let operaciones = " ";
let elements = document.querySelectorAll('.Open, .Save, .Borrar, .Agregar, .AgregarArista, .EliminarArista, .BFS, .DFS, .IDS, .BFS_H, .IDA_SS, .ASS');
elements.forEach(element => {
  element.addEventListener('click', () => {

    // Obtener los valores de los inputs de los nodos
    const Start = parseInt(document.getElementById('nodeStart').value, 10);
    const End = parseInt(document.getElementById('nodeObjet').value, 10);


    const clickedClass = element.classList[2];

    switch (clickedClass) {
      //__________________________________________BOTONES DE NODOS______________________________________
      case 'Borrar': alert('Selecione nodo'); operaciones = 'Borrar_Nodo'; break;
      case 'Agregar': alert('Clic en el mapa para agregar nodo'); break;
      case 'Save': saveProject(); break;
      case 'Open': openProject(); break;


      //__________________________________________BOTONES DE ARISTAS______________________________________
      case 'AgregarArista':/* alert('Selecione los nodos');*/ operaciones = 'Agregar_Arista'; break;
      case 'EliminarArista': alert('Selecione los nodos'); operaciones = 'Borrar_Arista'; break;

      //__________________________________________BOTONES DE OPERACIONES (ALGORTIMOS)______________________

      case 'BFS': BFS(Start, End); break;
      case 'DFS': DFS(Start, End); break;
      case 'IDS': IDS(Start, End); break;
      case 'BFS_H': BFS_H(Start, End); break;
      case 'ASS': ASS(Start, End); break;
      case 'IDA_SS': IDA_SS(Start, End); break;

      default: break;
    }
  });
});



const mapa = L.map('mapa').setView([10.4236, -75.5478], 14); // Coordenadas iniciales


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(mapa);


let EdgeStart;
let EdgeStartV = false;

mapa.on('click', function (e) {
  const { lat, lng } = e.latlng;

  const threshold = 0.00009;

  // Verificar si el nodo está cerca de un nodo existente
  const nearbyNode = nodes.find(node => {
    const distance = Math.sqrt(Math.pow(node.x - lat, 2) + Math.pow(node.y - lng, 2));
    return distance < threshold;
  });


  if (nearbyNode || operaciones != " ") {

    console.log(operaciones)

    switch (operaciones) {
      case 'Borrar_Nodo': deleteNode(nearbyNode.name); operaciones = " "; break;

      case 'Agregar_Arista':
        if (EdgeStartV) {

          const EdgeEnd = nearbyNode.name;
          addEdge(EdgeStart, EdgeEnd);

          EdgeStartV = false;
          operaciones = " "

        } else {

          console.log("Nodo selecionado: " + nearbyNode.name);

          EdgeStart = nearbyNode.name;
          EdgeStartV = true;

        }; break;

      case 'Borrar_Arista':
        if (EdgeStartV) {

          const EdgeEnd = nearbyNode.name;
          deleteEdge(EdgeStart, EdgeEnd);

          EdgeStartV = false;
          operaciones = " "

        } else {

          console.log("Nodo selecionado: " + nearbyNode.name);

          EdgeStart = nearbyNode.name;
          EdgeStartV = true;

        } break;

      default:
        if (operaciones == " ") { alert('No se seleciono ningun accion'); }
        else { alert('No se seleciono ningun elemento'); } break;
    }

    return;
  }






  const point = { name: nodeCounter, x: lat, y: lng };

  nodeCounter++;
  nodes.push(point);
  drawNodes();

  console.log(`Nodo agregado: ${JSON.stringify(point)}`);
});

mapa.on('load', () => {

});

mapa.on('moveend', () => {
  drawNodes();
});

