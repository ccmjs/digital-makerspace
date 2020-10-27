( async () => {

  let url = 'https://ccm2.inf.h-brs.de', apps = 'dms-apps', components = 'dms-components', default_icon = './img/logo.png';

  const params = new URL( window.location.href ).searchParams;
  let search = params.get( 'search' );
  if ( typeof search === 'string' ) {
    try {
      search = atob( search );
    } catch( e ) {}
    let items = [];
    const only = params.get( 'only' );
    if ( !only || only === 'apps' )
      items = items.concat( await getItems( apps, search ) );
    if ( !only || only === 'tools' )
      items = items.concat( await getItems( components, search ) );

    const list_elem = document.getElementById( 'results' );
    items.forEach( ( { icon = default_icon, format, title, subject = '', created_at, creator } ) => {
      const is_app = format === 'application/json';
      const entry_elem = document.createElement( 'li' );
      entry_elem.classList.add( 'media', 'border-top', is_app ? 'bg-find' : 'bg-create' );
      entry_elem.innerHTML = `
        <img src="${icon}" class="mr-3 rounded" alt="App Icon">
        <div class="media-body">
          <h5 class="mt-0 mb-1">${title} <span class="badge badge-${is_app ? 'success' : 'primary'}">${is_app ? 'App' : 'Tool'}</span></h5>
          ${subject ? subject + '<br>' : ''}
          <small>Created at ${created_at} by ${creator}</small>
        </div>
      `;
      list_elem.appendChild( entry_elem );
    } );

    async function getItems( store, query ) {
      return fetch( url, {
        method: 'POST',
        body: `{"store":"${store}","get":${query}}`
      } ).then( response => response.json() );
    }
  }

} )();