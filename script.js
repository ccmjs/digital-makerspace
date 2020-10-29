( async () => {

  const url = 'https://ccm2.inf.h-brs.de', apps = 'dms-apps', tools = 'dms-tools', components = 'dms-components', default_icon = './img/logo.png';

  // no data of published apps and components loaded yet? => start loading
  if ( !sessionStorage.getItem( apps ) || !sessionStorage.getItem( components ) || !sessionStorage.getItem( tools ) )
    loadAppsAndComponentsData();
  else {
    fillDataLists();      // has loaded data? => fill data lists for app and tool searches
    showSearchResults();  // show search results (only on webpage for search results)
  }

  /** loads data of all published apps and components and stores them in the Session Storage */
  function loadAppsAndComponentsData() {

    // load data of all published apps and components
    Promise.all( [
      ccm.get( { name: apps, url: url } ),
      ccm.get( { name: components, url: url } )
    ] ).then( items => {

      /**
       * predefined options for app and tool searches
       * @type {Object}
       */
      const term = {
        all: {},
        app: {
          all: {},
          title: {},
          creator: {},
          tag: {},
          lang: {}
        },
        component: {
          all: {},
          title: {},
          creator: {},
          tag: {}
        }
      };

      /** @function sets a value as key in an object if key not exists */
      const add = ( obj, key ) => !obj[ key ] && ( obj[ key ] = true );

      // collect predefined options for app searches and eliminate duplicates
      items[ 0 ].forEach( app => {
        add( term.all, app.title );
        add( term.app.all, app.title );
        add( term.app.title, app.title );

        add( term.all, app.creator );
        add( term.app.all, app.creator );
        add( term.app.creator, app.creator );

        app.tags.forEach( tag => {
          add( term.all, tag );
          add( term.app.all, tag );
          add( term.app.tag, tag );
        } );

        app.language && app.language.forEach( lang => {
          if ( !lang ) return;
          add( term.all, lang );
          add( term.app.all, lang );
          add( term.app.lang, lang );
        } );
      } );

      // collect predefined options for tool searches and eliminate duplicates
      items[ 1 ].forEach( component => {
        add( term.all, component.title );
        add( term.component.all, component.title );
        add( term.component.title, component.title );

        add( term.all, component.creator );
        add( term.component.all, component.creator );
        add( term.component.creator, component.creator );

        component.tags.forEach( tag => {
          add( term.all, tag );
          add( term.component.all, tag );
          add( term.component.tag, tag );
        } );
      } );

      // store collected predefined options for app and tool searches in Session Storage
      sessionStorage.setItem( 'all', JSON.stringify( Object.keys( term.all ).sort() ) );
      sessionStorage.setItem( 'app-all', JSON.stringify( Object.keys( term.app.all ).sort() ) );
      sessionStorage.setItem( 'app-title', JSON.stringify( Object.keys( term.app.title ).sort() ) );
      sessionStorage.setItem( 'app-creator', JSON.stringify( Object.keys( term.app.creator ).sort() ) );
      sessionStorage.setItem( 'app-tag', JSON.stringify( Object.keys( term.app.tag ).sort() ) );
      sessionStorage.setItem( 'app-lang', JSON.stringify( Object.keys( term.app.lang ).sort() ) );
      sessionStorage.setItem( 'component-all', JSON.stringify( Object.keys( term.component.all ).sort() ) );
      sessionStorage.setItem( 'component-title', JSON.stringify( Object.keys( term.component.title ).sort() ) );
      sessionStorage.setItem( 'component-creator', JSON.stringify( Object.keys( term.component.creator ).sort() ) );
      sessionStorage.setItem( 'component-tag', JSON.stringify( Object.keys( term.component.tag ).sort() ) );

      // store data of all published apps and components in Session Storage
      sessionStorage.setItem( apps, JSON.stringify( items[ 0 ] ) );
      sessionStorage.setItem( components, JSON.stringify( items[ 1 ] ) );

      // filter only highest versions of published components and store them in Session Storage
      const highest = {};
      sessionStorage.setItem( tools, JSON.stringify( items[ 1 ].forEach( component => {
        if ( !highest[ component.identifier ] || ccm.helper.compareVersions( highest[ component.identifier ].version, component.version ) < 0 )
          highest[ component.identifier ] = component;
      } ) ) );
      sessionStorage.setItem( tools, JSON.stringify( Object.values( highest ) ) );

      // for this session all predefined options for search inputs are present
      fillDataLists();      // => fill data lists for app and tool searches
      showSearchResults();  // => show search results (only on webpage for search results)

    } );

  }

  /** shows search results in frontend */
  function showSearchResults() {

    // is not webpage for search results? => abort
    if ( !location.pathname.endsWith( 'results.html' ) ) return;

    // collect relevant GET parameters from URL
    const params = new URL( window.location.href ).searchParams;
    const { only, search, title, tool, creator, tag, lang } = {
      only:    params.get( 'only'     ),
      search:  params.get( 'search'   ),
      title:   params.get( 'title'    ),
      tool:    params.get( 'tool'     ),
      creator: params.get( 'creator'  ),
      tag:     params.get( 'category' ),
      lang:    params.get( 'language' )
    };

    // determine search results
    let items = [];
    if ( !only || only === 'apps' )
      items = items.concat( getItems( apps ) );
    if ( !only || only === 'tools' )
      items = items.concat( getItems( tools ) );

    // sort search results by title
    items.sort( ( a, b ) => a.title.localeCompare( b.title ) );

    /**
     * list element for search results
     * @type {HTMLElement}
     */
    const list_elem = document.getElementById( 'search_results' );

    if ( !items.length )
      return list_elem.outerHTML = '<div class="lead p-3"><i>Nothing could be found.</i></div>';

    // add a list entry for each search result
    items.forEach( ( { key, icon, format, title, subject = '', created_at, creator } ) => {
      if ( !icon || !icon.trim() ) icon = default_icon;
      created_at = moment( created_at ).fromNow();
      const is_app = format === 'application/json';

      // create a list entry element and add it in the list of search results
      const entry_elem = document.createElement( 'li' );
      entry_elem.dataset.is = is_app ? 'app' : 'tool';
      entry_elem.dataset.key = key;
      entry_elem.classList.add( 'media', 'border-top', is_app ? 'bg-app' : 'bg-tool' );
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

    /**
     * finds items in the Session Storage
     * @param {string} key - item key in the Session Storage where the items are stored
     * @returns {Object[]} search results
     */
    function getItems( key ) {

      // get relevant items from Session Storage
      const items =  JSON.parse( sessionStorage.getItem( key ) );

      // simple search
      if ( search )
        return items.filter( item => {
          for ( const key in item ) {
            if ( item.hasOwnProperty( key ) )
              if ( Array.isArray( item[ key ] ) ) {
                for ( let i = 0; i < item[ key ].length; i++ )
                  if ( item[ key ][ i ].toString().includes( search ) )
                    return true;
              }
              else if ( item[ key ].toString().includes( search ) )
                return true;
          }
        } );

      /**
       * metadata of all published components
       * @type {Object[]}
       */
      const tools = JSON.parse( sessionStorage.getItem( components ) );

      /**
       * finds metadata of a component in Session Storage
       * @function
       * @param {string} path - component URL
       * @returns {Object} component metadata
       */
      const getComponent = path => tools.find( component => component.path === path );

      // advanced search
      return items.filter( item => {
        if ( title   && title   !==                                item.title   ) return false;
        if ( tool    && tool    !== ( getComponent( item.path ) || {} ).title   ) return false;
        if ( creator && creator !==                                item.creator ) return false;
        if ( tag     && ( !item.tags     || !item.tags    .includes( tag  ) )   ) return false;
        if ( lang    && ( !item.language || !item.language.includes( lang ) )   ) return false;
        return true;
      } );

    }

  }

  /** fills the data lists for search inputs with entries */
  function fillDataLists() {

    // Search Bar
    const search_bar = document.querySelector( 'input[type=search]' );
    if ( !search_bar ) return;
    fillDataList( 'all' );
    fillDataList( 'app-all' );
    fillDataList( 'component-all' );
    search_bar.addEventListener( 'change', () => document.querySelector( 'form' ).submit() );

    // Advanced Search
    fillDataList( 'app-title' );
    fillDataList( 'component-title' );
    fillDataList( 'app-creator' );
    fillDataList( 'app-tag' );
    fillDataList( 'app-lang' );
    fillDataList( 'component-title' );
    fillDataList( 'component-creator' );
    fillDataList( 'component-tag' );

    /**
     * fills a data list with entries
     * @param {string} key - item key in the Session Storage where the entry values are stored; HTML ID of the data list
     */
    function fillDataList( key ) {
      const datalist = document.querySelector( `datalist#${key}` );
      if ( !datalist ) return;
      JSON.parse( sessionStorage.getItem( key ) ).forEach( term => {
        const entry = document.createElement( 'option' );
        entry.innerText = term;
        datalist.append( entry );
      } );
    }

  }

} )();