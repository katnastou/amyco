var cy = cytoscape({ 
      container: $(document).getElementById('cy'),
      elements: [
          // nodes
          { data: { id: 'a' } },
          { data: { id: 'b' } },
          { data: { id: 'c' } },
          { data: { id: 'd' } },
          { data: { id: 'e' } },
          { data: { id: 'f' } },
          // edges
          {
            data: {
              id: 'ab',
              source: 'a',
              target: 'b'
            }
          },
          {
            data: {
              id: 'cd',
              source: 'c',
              target: 'd'
            }
          },
          {
            data: {
              id: 'ef',
              source: 'e',
              target: 'f'
            }
          },
          {
            data: {
              id: 'ac',
              source: 'a',
              target: 'c'
            }
          },
          {
            data: {
              id: 'be',
              source: 'b',
              target: 'e'
            }
          }
        ],
      style: [
            {
                selector: 'node',
                style: {
                    shape: 'hexagon',
                    'background-color': 'red',
                    label: 'data(id)'
                }
            },
            {
              selector: 'edge',
                style: {
                  'color':'red'
                }
            }] 
 }); 
 
 cy.layout({
    name: 'circle'
}).run();

