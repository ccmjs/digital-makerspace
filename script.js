( async () => {

  let elem, url = 'https://ccm2.inf.h-brs.de', apps = 'dms-apps', components = 'dms-components';

  document.querySelectorAll( '.app-category' ).forEach( category => {
    category.setAttribute( 'href', './results.html?is=app&search=' + btoa( '{"tags":"' + category.querySelector( 'h5' ).innerText + '"}' ) );
  } );

  let params = new URL( window.location.href ).searchParams;
  let search = params.get( 'search' );
  let type = params.get( 'is' );
  if ( search ) {
    if ( type === 'app' ) {
      const apps = await getApps( atob( search ) );
      const results = document.getElementById( 'results' );
      console.log( apps );
      apps.forEach( ( { icon = './img/logo.png', title, subject = '', created_at, creator } ) => {
        elem = document.createElement( 'li' );
        elem.classList.add( 'media', 'border-top', 'bg-find' );
        elem.innerHTML = `
          <img src="${icon}" class="mr-3" alt="App Icon">
          <div class="media-body">
            <h5 class="mt-0 mb-1">${title} <span class="badge badge-success">App</span></h5>
            ${subject ? subject + '<br>' : ''}
            <small>Created at ${created_at} by ${creator}</small>
          </div>
        `;
        results.appendChild( elem );
      } );
    }
  }

  async function getApps( query ) {
    return fetch( url, {
      method: 'POST',
      body: '{"store":"' + apps + '","get":' + query + '}'
    } ).then( response => response.json() );
  }

} )();
