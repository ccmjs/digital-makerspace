( async () => {

  let url = 'https://ccm2.inf.h-brs.de', apps = 'dms-apps', tools = 'dms-components', default_icon = './img/logo.png';

  if ( !sessionStorage.getItem( apps ) || !sessionStorage.getItem( tools ) ) {
    Promise.all( [
      ccm.get( { name: apps, url: url } ),
      ccm.get( { name: tools, url: url } )
    ] ).then( items => {
      sessionStorage.setItem( apps, JSON.stringify( items[ 0 ] ) );
      sessionStorage.setItem( tools, JSON.stringify( items[ 1 ] ) );
    } );
  }

  const params = new URL( window.location.href ).searchParams;
  let search = params.get( 'search' );
  if ( typeof search === 'string' ) {
    try {
      search = JSON.parse( atob( search ) );
    } catch( e ) {}
    let items = [];
    const only = params.get( 'only' );
    if ( !only || only === 'apps' )
      items = items.concat( getItems( apps, search ) );
    if ( !only || only === 'tools' )
      items = items.concat( getItems( tools, search ) );
    items.sort( ( a, b ) => a.title.localeCompare( b.title ) );

    const list_elem = document.getElementById( 'results' );
    items.forEach( ( { icon, format, title, subject = '', created_at, creator } ) => {
      if ( !icon || !icon.trim() ) icon = default_icon;
      created_at = moment( created_at ).fromNow();
      const is_app = format === 'application/json';
      const entry_elem = document.createElement( 'li' );
      entry_elem.classList.add( 'media', 'border-top', is_app ? 'bg-find' : 'bg-create' );
      entry_elem.innerHTML = `
        <img src="${icon}" class="mr-3 rounded" alt="App Icon">
        <div class="media-body">
          <h5 class="mt-0 mb-1">${title} <span class="badge badge-${is_app ? 'success' : 'primary'}">${is_app ? 'App' : 'Tool'}</span></h5>
          ${subject ? subject + '<br>' : ''}
          <small>Created ${created_at} by ${creator}</small>
        </div>
      `;
      list_elem.appendChild( entry_elem );
    } );

    function getItems( store, query ) {
      store = JSON.parse( sessionStorage.getItem( store ) );
      const items = [];
      store.forEach( item => {
        if ( typeof query !== 'string' ) {
          for ( const key in query )
            if ( !item[ key ].includes( query[ key ] ) )
              return;
          items.push( item );
        }
        else
          for ( const key in item ) {
            if ( !Array.isArray( item[ key ] ) )
              item[ key ] = item[ key ].toString();
            if ( item[ key ].includes( query ) )
              return items.push( item );
          }
      } )
      return items;
    }
  }

} )();