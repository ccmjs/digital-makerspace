( async () => {

  const url = 'https://ccm2.inf.h-brs.de', apps = 'dms-apps', tools = 'dms-tools', components = 'dms-components', default_icon = './img/logo.png';

  if ( !sessionStorage.getItem( apps ) || !sessionStorage.getItem( tools ) )
    loadAppsAndToolsData();
  else
    addDatalistEntries();

  showSearchResults();

  function loadAppsAndToolsData() {

    if ( !sessionStorage.getItem( apps ) ) {
      Promise.all( [
        ccm.get( { name: apps, url: url } ),
        ccm.get( { name: components, url: url } )
      ] ).then( items => {

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
            developer: {},
            tag: {}
          }
        };

        const add = ( obj, key ) => !obj[ key ] && ( obj[ key ] = true );

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

        items[ 1 ].forEach( component => {
          add( term.all, component.title );
          add( term.component.all, component.title );
          add( term.component.title, component.title );

          add( term.all, component.creator );
          add( term.component.all, component.creator );
          add( term.component.developer, component.creator );

          component.tags.forEach( tag => {
            add( term.all, tag );
            add( term.component.all, tag );
            add( term.component.tag, tag );
          } );
        } );

        sessionStorage.setItem( 'all', JSON.stringify( Object.keys( term.all ).sort() ) );
        sessionStorage.setItem( 'app-all', JSON.stringify( Object.keys( term.app.all ).sort() ) );
        sessionStorage.setItem( 'app-title', JSON.stringify( Object.keys( term.app.title ).sort() ) );
        sessionStorage.setItem( 'app-creator', JSON.stringify( Object.keys( term.app.creator ).sort() ) );
        sessionStorage.setItem( 'app-tag', JSON.stringify( Object.keys( term.app.tag ).sort() ) );
        sessionStorage.setItem( 'app-lang', JSON.stringify( Object.keys( term.app.lang ).sort() ) );

        sessionStorage.setItem( 'component-all', JSON.stringify( Object.keys( term.component.all ).sort() ) );
        sessionStorage.setItem( 'component-title', JSON.stringify( Object.keys( term.component.title ).sort() ) );
        sessionStorage.setItem( 'component-developer', JSON.stringify( Object.keys( term.component.developer ).sort() ) );
        sessionStorage.setItem( 'component-tag', JSON.stringify( Object.keys( term.component.tag ).sort() ) );

        sessionStorage.setItem( apps, JSON.stringify( items[ 0 ] ) );
        sessionStorage.setItem( components, JSON.stringify( items[ 1 ] ) );

        const highest = {};
        sessionStorage.setItem( tools, JSON.stringify( items[ 1 ].forEach( component => {
          if ( !highest[ component.identifier ] || ccm.helper.compareVersions( highest[ component.identifier ].version, component.version ) < 0 )
            highest[ component.identifier ] = component;
        } ) ) );
        sessionStorage.setItem( tools, JSON.stringify( Object.values( highest ) ) );

        addDatalistEntries();
      } );
    }
  }

  function showSearchResults() {

    const params = new URL( window.location.href ).searchParams;
    let search = params.get( 'search' );
    if ( typeof search === 'string' ) {
      try {
        search = JSON.parse( atob( search ) );
      } catch( e ) {}
      let items = [];
      const only = params.get( 'only' );
      if ( only ) {
        document.querySelector( 'form' ).appendChild( ccm.helper.html( `<input type="hidden" name="only" value="${only}">` ) );
        document.querySelector( 'datalist' ).dataset.only = only;
        document.querySelector( 'input[list=items]' ).setAttribute( 'placeholder', only === 'apps' ? 'Title, Component, Creator, Category, Tag, Language' : 'Title, Developer, Category, Tag' );
      }
      if ( !only || only === 'apps' )
        items = items.concat( getItems( apps, search ) );
      if ( !only || only === 'tools' )
        items = items.concat( getItems( tools, search ) );
      items.sort( ( a, b ) => a.title.localeCompare( b.title ) );

      const list_elem = document.getElementById( 'results' );
      items.forEach( ( { key, icon, format, title, subject = '', created_at, creator } ) => {
        if ( !icon || !icon.trim() ) icon = default_icon;
        created_at = moment( created_at ).fromNow();
        const is_app = format === 'application/json';
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
  }

  function addDatalistEntries() {

    const datalist = document.querySelector( 'datalist' );
    if ( datalist ) {
      const add = key => {
        JSON.parse( sessionStorage.getItem( key ) ).forEach( term => {
          const entry = document.createElement( 'option' );
          entry.innerText = term;
          datalist.append( entry );
        } );
      };
      if ( datalist.dataset.only === 'apps' )
        add( 'app-all' );
      else if ( datalist.dataset.only === 'tools' )
        add( 'component-all' );
      else
        add( 'all' );
      document.querySelector( 'input[list=items]' ).addEventListener( 'change', () => document.querySelector( 'form' ).submit() );
    }
  }

} )();