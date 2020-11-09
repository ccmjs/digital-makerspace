( async () => {

  const url = 'https://ccm2.inf.h-brs.de';                      // URL of cloud service for data management
  const params = new URL( window.location.href ).searchParams;  // GET parameters
  const apps = 'dms-apps';                                      // name of datastore for apps metadata in cloud service and session storage
  const configs = 'dms-configs';                                // name of datastore for app configurations in cloud service and session storage
  const tools = 'dms-tools';                                    // name of datastore for tools in session storage
  const components = 'dms-components';                          // name of datastore for components metadata in cloud service and session storage
  const users = 'dms-user';                                     // name of datastore for users data in cloud service and current user data in session storage
  const realm = 'cloud';                                        // realm name for user authentication
  const default_icon = './img/logo.png';                        // path to default app icon
  const items = {};

  // no data of published apps and components loaded yet? => start loading
  if ( !sessionStorage.getItem( apps ) || !sessionStorage.getItem( components ) || !sessionStorage.getItem( tools ) )
    init();
  else
    ready();

  /** loads data of all published apps and components and stores them in the Session Storage */
  function init() {

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
        if ( !app.published ) return;

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

      // all data is loaded => Digital Makerspace is ready to use!
      ready();

    } );

  }

  /** when all data is loaded */
  function ready() {

    fillDataLists();  // fill data lists for app and tool searches
    movableModals();  // make modal dialogs movable

    /**
     * user data if user is logged in
     * @type {Object}
     */
    let user = JSON.parse( sessionStorage.getItem( users ) );

    // display user as logged in or logged out
    user ? showLoggedIn() : showLoggedOut();

    // set submit event for login form
    document.querySelector( '#login-form' ).addEventListener( 'submit', async event => {
      event.preventDefault();
      let params = { realm: realm, store: users };
      $( event.target ).serializeArray().forEach( ( { name, value } ) => params[ name ] = value );
      params.token = md5( params.token );
      try {
        user = await ccm.load( { url: url, params: params } );
        sessionStorage.setItem( users, JSON.stringify( user ) );
        showLoggedIn();
        $( '#login-dialog' ).modal( 'hide' );
        event.target.reset();
      }
      catch ( e ) {
        renderHint( document.querySelector( '#login-form .hint' ), 'Login failed. Please try again.' );
      }
    } );

    // set submit event for registration form
    document.querySelector( '#register-form' ).addEventListener( 'submit', async event => {
      event.preventDefault();
      const params = {
        store: users,
        set: {
          realm: realm,
          _: {
            realm: realm,
            access: {
              get: 'creator',
              set: 'creator',
              del: 'creator'
            }
          }
        }
      };
      $( event.target ).serializeArray().forEach( ( { name, value } ) => params.set[ name ] = value );
      params.set.key = params.set.user;
      params.set.token = md5( params.set.token );
      params.set._.creator = params.set.key;
      try {
        await ccm.load( { url: url, params: params } );
        sessionStorage.setItem( users, JSON.stringify( await ccm.load( {
          url: url,
          params: {
            realm: realm,
            store: users,
            user: params.set.key,
            token: params.set.token
          }
        } ) ) );
        $( '#register-dialog' ).modal( 'hide' );
        $( '#register-success-dialog' ).modal( 'show' );
        event.target.reset();
      }
      catch ( e ) {
        renderHint( document.querySelector( '#register-form .hint' ), 'Registration failed. Maybe try a different username.' );
      }
    } );

    // set click event for logout button
    document.querySelector( '#logout-btn' ).addEventListener( 'click', () => {
      sessionStorage.removeItem( users );
      user = null;
      showLoggedOut();
    } );

    // show search results
    if ( location.pathname.endsWith( 'results.html' ) )
      showSearchResults();

    // integrate dynamic data in the webpage for a published app
    if ( location.pathname.endsWith( 'app.html' ) )
      updateAppView();

    // integrate dynamic data in the webpage for a published tool
    if ( location.pathname.endsWith( 'tool.html' ) )
      updateToolView();

    /** shows search results in frontend */
    function showSearchResults() {

      // collect relevant GET parameters from URL
      const { my, only, search, title, tool, creator, tag, lang } = {
        my:      params.get( 'my'       ),
        only:    params.get( 'only'     ),
        search:  params.get( 'search'   ),
        title:   params.get( 'title'    ),
        tool:    params.get( 'tool'     ),
        creator: params.get( 'author'   ),
        tag:     params.get( 'category' ),
        lang:    params.get( 'language' )
      };

      // determine search results
      let items = [];
      if ( my === 'apps' ) {
        if ( user )
          items = items.concat( getItems( apps ).filter( app => app._.creator === user.key && app._.realm === user.realm ) );
      }
      else {
        if ( !only || only === 'apps' )
          items = items.concat( findItems( apps ) );
        if ( !only || only === 'tools' )
          items = items.concat( findItems( tools ) );
      }

      // sort search results by title
      items.sort( ( a, b ) => a.title.localeCompare( b.title ) );

      /**
       * list element for search results
       * @type {HTMLElement}
       */
      const list_elem = document.querySelector( '#search_results' );

      if ( !items.length )
        return list_elem.outerHTML = '<div class="lead p-3"><i>Nothing could be found.</i></div>';

      // add a list entry for each search result
      items.forEach( ( { key, icon, format, title, subject = '', created_at, creator } ) => {
        if ( !icon || !icon.trim() ) icon = default_icon;
        created_at = moment( created_at ).fromNow();
        const is_app = format === 'application/json';

        // create a list entry element and add it in the list of search results
        const entry_elem = document.createElement( 'a' );
        entry_elem.setAttribute( 'href', `./${is_app ? 'app' : 'tool'}.html?id=${key}` );
        entry_elem.classList.add( 'link-unstyled' );
        entry_elem.innerHTML = `
          <li class="media border-top ${is_app ? 'bg-app' : 'bg-tool'}">
            <img src="${icon}" class="mr-3 rounded" alt="App Icon">
            <div class="media-body">
              <h5 class="mt-0 mb-1">${title} <span class="badge badge-${is_app ? 'success' : 'primary'}">${is_app ? 'App' : 'Tool'}</span></h5>
              ${subject ? subject + '<br>' : ''}
              <small>Created ${created_at} by ${creator}</small>
            </div>
          </li>
        `;
        list_elem.appendChild( entry_elem );

      } );

      /**
       * finds items in the Session Storage
       * @param {string} key - item key in the Session Storage where the items are stored
       * @returns {Object[]} search results
       */
      function findItems( key ) {

        // get relevant items from Session Storage
        const items = getItems( key );

        // simple search
        if ( search )
          return items.filter( item => {
            if ( item.format === 'application/json' && !item.published ) return false;
            for ( const key in item ) {
              if ( item.hasOwnProperty( key ) )
                if ( Array.isArray( item[ key ] ) ) {
                  for ( let i = 0; i < item[ key ].length; i++ )
                    if ( item[ key ][ i ].toString().toLowerCase().includes( search.toLowerCase() ) )
                      return true;
                }
                else if ( item[ key ].toString().toLowerCase().includes( search.toLowerCase() ) )
                  return true;
            }
            return false;
          } );

        /**
         * finds metadata of a component by component URL in Session Storage
         * @function
         * @param {string} path - component URL
         * @returns {Object} component metadata
         */
        const getComponent = path => getItems( components ).find( component => component.path === path );

        // advanced search
        return items.filter( item => {
          if ( item.format === 'application/json' && !item.published            ) return false;
          if ( title   && title   !== item.title                                ) return false;
          if ( tool    && tool    !== ( getComponent( item.path ) || {} ).title ) return false;
          if ( creator && creator !== item.creator                              ) return false;
          if ( tag     && ( !item.tags     || !item.tags    .includes( tag  ) ) ) return false;
          if ( lang    && ( !item.language || !item.language.includes( lang ) ) ) return false;
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

    /** integrates the app metadata in the webpage for a published app */
    function updateAppView() {

      // get key and metadata of the app
      const key = params.get( 'id' );
      const app = getItems( apps ).find( item => item.key === key );
      const tool = getItems( components ).find( item => item.path === app.path );
      const config = [ 'ccm.get', app.source[ 0 ], app.source[ 1 ] ];
      const app_url = location.href.replace( 'app.html', 'show.html' );

      // change webpage title
      document.title = document.title.replace( '${title}', app.title );

      // add media list entry for the app in the trailer area
      document.querySelector( '#abstract' ).innerHTML = `
        <ul class="list-unstyled">
          <li class="media">
            <img src="${app.icon || default_icon}" class="mr-3 rounded" alt="App Icon">
            <div class="media-body">
              <h5 class="mt-0 mb-1">${app.title} <span class="badge badge-success">App</span></h5>
              ${app.subject ? app.subject + '<br>' : ''}
              <small class="text-nowrap">Created ${moment( app.created_at ).fromNow()} by ${app.creator}</small>
            </div>
          </li>
        </ul>
      `;

      // add target URL for the link button to create a similar app
      document.querySelector( '#trailer nav a' ).setAttribute( 'href', `./tool.html?id=${tool.key}&template=${key}` );

      // add inputs for handover of the app
      document.querySelector( '#handover #inputs' ).innerHTML = `

        <!-- Embed Code -->
        <div id="embed_code" class="input-group mb-3">
          <div id="embed-code" class="input-group-prepend">
            <span class="input-group-text">Embed</span>
          </div>
          <input readonly type="text" id="embed_code-input" class="form-control bg-white" aria-label="Embed Code">
          <div class="input-group-append">
            <button id="embed_copy" class="btn btn-success" type="button">Copy</button>
          </div>
        </div>
        
        <!-- App URL -->
        <div id="app_url" class="input-group mb-3">
          <div class="input-group-prepend">
            <span class="input-group-text">URL</span>
          </div>
          <input readonly type="text" id="app_url-input" class="form-control bg-white" aria-label="App URL">
          <div class="input-group-append">
            <button id="url_copy" class="btn btn-success" type="button">Copy</button>
          </div>
        </div>
        
        <!-- App ID -->
        <div id="app_id" class="input-group mb-3">
          <div class="input-group-prepend">
            <span class="input-group-text">App ID</span>
          </div>
          <input readonly type="text" id="app_id-input" class="form-control bg-white" aria-label="App ID">
          <div class="input-group-append">
            <button id="id_copy" class="btn btn-success" type="button">Copy</button>
          </div>
        </div>
        
      `;

      // set embed code with copy button
      const input_embed = document.querySelector( '#embed_code-input' );
      input_embed.value = `<script src='${tool.path}'></script><ccm-${tool.key} key='${ccm.helper.stringify(config)}'></ccm-${tool.key}>`;
      document.querySelector( '#embed_copy' ).addEventListener( 'click', () => { input_embed.select(); document.execCommand( 'copy' ); } );

      // set app URL with copy button
      const input_url = document.querySelector( '#app_url-input' );
      input_url.value = app_url;
      document.querySelector( '#url_copy' ).addEventListener( 'click', () => { input_url.select(); document.execCommand( 'copy' ); } );

      // set app ID with copy button
      const input_id = document.querySelector( '#app_id-input' );
      input_id.value = app.key;
      document.querySelector( '#id_copy' ).addEventListener( 'click', () => { input_id.select(); document.execCommand( 'copy' ); } );

      // show QR Code
      const qr_code = qrcode( 0, 'M' );
      qr_code.addData( app_url );
      qr_code.make();
      const qr_code_elem = document.createElement( 'div' );
      qr_code_elem.innerHTML = qr_code.createImgTag();
      document.querySelector( '#qr_code' ).appendChild( qr_code_elem.firstChild );

      // fill the input fields of the form for edit app information with initial values
      document.querySelector( '#title' ).value = app.title;
      document.querySelector( '#icon' ).value = app.icon || '';
      document.querySelector( '#subject' ).value = app.subject || '';
      document.querySelector( '#description' ).value = app.description || '';
      const tags = $( document.querySelector( '#tags' ) ).selectize( {
        create: true,
        plugins: [ 'remove_button' ],
        valueField: 'value',
        labelField: 'value',
        searchField: 'value',
        options: JSON.parse( sessionStorage.getItem( 'app-tag' ) ).map( tag => { return { value: tag }; } ),
        items: app.tags
      } )[ 0 ].selectize;
      app.language.forEach( lang => document.querySelector( '#' + lang ).checked = true );

      // set submit event of the form for edit app information
      document.querySelector( '#edit-meta-form' ).addEventListener( 'submit', async event => {
        event.preventDefault();
        if ( !user ) return;
        const app_meta = { key: key, language: [] };
        $( '#edit-meta-form' ).serializeArray().forEach( ( { name, value } ) => value && ( name === 'language' ? app_meta[ name ].push( value ) : app_meta[ name ] = value ) );
        app_meta.tags = tags.items;
        const store = await ccm.store( { name: apps, url: url, token: user.token, realm: user.realm } );
        const response = await store.set( app_meta );
        sessionStorage.removeItem( apps );
        response === key && location.reload();
      } );

      // set click event for the "I agree" button
      document.querySelector( '#agree-btn' ).addEventListener( 'click', async () => {
        if ( !user ) return;
        const store = await ccm.store( { name: apps, url: url, token: user.token, realm: user.realm } );
        const response = await store.set( { key: key, published: true } );
        sessionStorage.removeItem( apps );
        response === key && location.reload();
      } );

      // show app in the app area
      ccm.get( app.source[ 0 ], app.source[ 1 ] ).then( config => ccm.start( app.path, Object.assign( config, { root: document.querySelector( '#app article' ) } ) ) ).then( cleanHead );

      // add target URL for the link button to open the App in a new tab to how it in fullscreen
      document.querySelector( '#app a' ).setAttribute( 'href', app_url );

      // add app description
      const desc_elem = document.querySelector( '#description' );
      if ( app.description )
        desc_elem.querySelector( 'article' ).innerHTML = app.description;
      else
        desc_elem.parentNode.removeChild( desc_elem );

      // add table with app metadata
      document.querySelector( '#meta article' ).innerHTML = `
        <table class="table">
          <tbody>
            <tr>
              <th scope="row">Author</th>
              <td><a href="./results.html?author=${app.creator}" title="Find all Apps and Tools of this Author">${app.creator}</a></td>
            </tr>
            <tr>
              <th scope="row">Category</th>
              <td>${app.tags.map( tag => `<a href="./results.html?category=${tag}" title="Find all Apps and Tools of this Category">${tag}</a>` ).join( ', ' ) || '-'}</td>
            </tr>
            <tr>
              <th scope="row">Language</th>
              <td>${( app.language || [] ).map( lang => `<a href="./results.html?language=${lang}" title="Find all Apps in this Language">${lang.toUpperCase()}</a>` ).join( ', ' ) || '-'}</td>
            </tr>
            <tr>
              <th scope="row">Content Licence</th>
              <td><a href="https://creativecommons.org/share-your-work/public-domain/cc0/" target="_blank" title="Every published App is Public Domain">${app.license}</a></td>
            </tr>
            <tr>
              <th scope="row">Software Licence</th>
              <td><a href="https://en.wikipedia.org/wiki/MIT_License" target="_blank" title="Every published App is Free Software">MIT Licence</a></td>
            </tr>
            <tr>
              <th scope="row">Created with Tool</th>
              <td><a href="./tool.html?id=${tool.key}" title="Opens the Tool that was used to create this App">${tool.title}</a></td>
            </tr>
            <tr>
              <th scope="row">Release Date</th>
              <td>${moment( app.created_at ).format( 'LLL' )}</td>
            </tr>
          </tbody>
        </table>
      `;

      // app is published?
      if ( app.published ) {
      }
      else {
        document.querySelector( '#reviews' ).style.display = 'none';
      }

      // current user is the app creator?
      if ( user && app._.creator === user.key && app._.realm === user.realm ) {
        const button = document.querySelector( '#create-similar-btn' );
        button.innerText = 'Edit App';
        button.title = 'Opens the Toolbox to edit your App';
        if ( !app.published )
          document.querySelector( '#publish-app-btn' ).classList.remove( 'd-none' );
      }
      else {
        document.querySelector( '#edit-meta-btn' ).style.display = 'none';
      }

    }

    /** shows a tool for app creation in frontend */
    function updateToolView() {

      // collect GET parameters from URL
      const key = params.get( 'id' );                                        // ID of the tool
      const use = params.get( 'use' );                                       // title of the app builder that is used
      const template = params.get( 'template' );                             // ID of the app that is used as template
      const tool = getItems( components ).find( item => item.key === key );  // metadata of the tool

      // change webpage title
      document.title = document.title.replace( '${title}', tool.title );

      // add media list entry for the app in the trailer area
      document.querySelector( '#abstract' ).innerHTML = `
        <ul class="list-unstyled">
          <li class="media">
            <img src="${tool.icon || default_icon}" class="mr-3 rounded" alt="Tool Icon">
            <div class="media-body">
              <h5 class="mt-0 mb-1">${tool.title} <span class="text-nowrap"><span class="badge badge-primary">Tool</span> <a href="#" class="badge badge-light">${tool.version}</a></span></h5>
              ${tool.subject ? tool.subject + '<br>' : ''}
              <small class="text-nowrap">Created ${moment( tool.created_at ).fromNow()} by ${tool.creator}</small>
            </div>
          </li>
        </ul>
      `;

      /** reloads the webpage of this tool with a specific app as template for app creation */
      const useTemplate = app_id => app_id && ccm.helper.isKey( app_id ) && location.assign( location.origin + location.pathname + '?id=' + key + ( use ? '&use=' + use : '' ) + '&template=' + app_id );

      // set click event for the button to load an app as template by embed code
      document.querySelector( '#embed_load' ).addEventListener( 'click', () => {
        const match = document.querySelector( '#embed_code' ).value.match( /},"(.*)"]'/ );
        if ( !match ) return;
        const app_meta = getItems( apps ).find( item => item.source[ 1 ] === match[ 1 ] )
        app_meta && useTemplate( app_meta.key );
      } );

      // set click event for the button to load an app as template by app URL
      document.querySelector( '#url_load' ).addEventListener( 'click', () => {
        const match = document.querySelector( '#app_url' ).value.match( /id=(.*)/ );
        useTemplate( match && match[ 1 ] );
      } );

      // set click event for the button to load an app as template by app ID
      document.querySelector( '#id_load' ).addEventListener( 'click', () => {
        useTemplate( document.querySelector( '#app_id' ).value );
      } );

      // add target URL for the link button to show all published apps that were created with this tool
      document.querySelector( '#all-apps' ).setAttribute( 'href', './results.html?tool=' + tool.title );

      // prepare app builders
      const builder_elem = document.querySelector( '#app_builder article' );
      const builders = tool.ignore.builders;
      if ( !builders.length ) return builder_elem.innerHTML = '<p class="lead pt-3 text-center">Sorry! This tool has no app builder yet.</p>';
      builders.push( {
        title: 'JSON Builder',
        app: [ 'ccm.component', 'https://ccmjs.github.io/akless-components/json_builder/versions/ccm.json_builder-2.1.0.js', { directly: true, nosubmit: true } ]
      } );

      // show active app builder in the app builder area
      let builder = builders[ 0 ];
      if ( use ) builder = builders.find( builder => builder.title === use );
      const config = sessionStorage.getItem( 'config' );
      config && sessionStorage.removeItem( 'config' );
      const app = !config && getItems( apps ).find( item => item.key === template );
      let builder_inst;
      Promise.all( [
        ccm.helper.solveDependency( builder.app ),
        config && JSON.parse( config ) || app && ccm.get( app.source[ 0 ], app.source[ 1 ] )
      ] ).then( ( [ component, template ] ) => component.start( {
        root: builder_elem,
        data: { store: [ 'ccm.store', { app: template } ], key: 'app' }
      } ) ).then( builder => { builder_inst = builder; cleanHead(); } );

      // add entries for tab menu to switch between app builders
      const tabs = document.querySelector( '#tabs' );
      builders.forEach( ( builder, i ) => {
        const li = document.createElement( 'li' );
        li.classList.add( 'nav-item' );
        li.innerHTML = `<a class="nav-link ${use && use === builder.title || !use && !i ? 'active' : '' }" href="./tool.html?id=${key}&use=${builder.title}${template ? '&template=' + template : ''}">${builder.title}</a>`;
        li.querySelector( 'a' ).addEventListener( 'click', () => builder_inst && sessionStorage.setItem( 'config', JSON.stringify( builder_inst.getValue() ) ) );
        tabs.appendChild( li );
      } );
      use && tabs.classList.add( 'show' );

      // set click event for the preview button
      document.querySelector( '#preview-btn' ).addEventListener( 'click', () => {
        if ( !builder_inst ) return;
        ccm.start( tool.path, Object.assign( builder_inst.getValue(), { root: document.querySelector( '#preview' ) } ) );
      } );

      // current user is the app creator?
      if ( user && app && app._.creator === user.key && app._.realm === user.realm ) {

        // set click event for the 'Save' buttons
        $( '.save-app-btn' ).click( () => {
        } );

        // rename "Create App" button
        $( '.create-app-btn' ).text( 'Create As New' );

      }
      else {

        // hide "Save" button
        $( '.save-app-btn' ).hide();

      }

      // prepare input of app categories
      const tags = $( document.querySelector( '#tags' ) ).selectize( {
        create: true,
        plugins: [ 'remove_button' ],
        valueField: 'value',
        labelField: 'value',
        searchField: 'value',
        options: JSON.parse( sessionStorage.getItem( 'app-tag' ) ).map( tag => { return { value: tag }; } )
      } )[ 0 ].selectize;

      // set submit event for app creation form
      document.querySelector( '#app-creation-form' ).addEventListener( 'submit', event => {
        event.preventDefault();
        $( '#app-creation' ).modal( 'hide' );
        $( '#publish-app' ).modal( 'show' );
      } );

      // user must be logged in to save an app
      $( '#publish-app' ).on( 'show.bs.modal', () => {
        if ( user ) {
          $( '#publish-app button' ).prop( 'disabled', false );
          document.querySelector( '#publish-app .hint' ).innerHTML = '';
        }
        else {
          $( '#publish-app button' ).prop( 'disabled', true );
          document.querySelector( '#publish-app .hint' ).innerText = 'You are currently not logged in';
        }
      } );

      // set click event for the button that saves the app without publish
      document.querySelector( '#create-app-btn' ).addEventListener( 'click', () => createApp( false ) );

      // set click event for the button that saves and publishes the app
      document.querySelector( '#publish-app-btn' ).addEventListener( 'click', () => $( '#agreement' ).modal( 'show' ) );

      // set click event for the "I agree" button
      document.querySelector( '#agree-btn' ).addEventListener( 'click', () => createApp( true ) );

      /**
       * creates an app
       * @param {boolean} [publish] - app should be published
       */
      function createApp( publish) {

        /**
         * dataset key of app metadata and app configuration
         * @type {string}
         */
        const key = ccm.helper.generateKey();

        /**
         * app metadata
         * @type {Object}
         */
        const meta = {
          key: key,
          creator: user.name,
          language: [],
          format: 'application/json',
          license: publish ? 'CC0' : '-',
          metaFormat: 'ccm-meta',
          metaVersion: '2.0.0',
          path: tool.path,
          source: [ { name: configs, url: url }, key ],
          published: publish,
          _: { creator: user.key, realm: realm, access: { get: 'all', set: 'creator', del: 'creator' } }
        };

        // add input values in app metadata
        $( '#app-creation-form' ).serializeArray().forEach( ( { name, value } ) => value && ( name === 'language' ? meta[ name ].push( value ) : meta[ name ] = value ) );
        meta.tags = tags.items;

        // user must be logged in
        if ( !user ) return $( '#app-creation' ).modal( 'show' );

        /**
         * app configuration
         * @type {Object}
         */
        const config = Object.assign( builder_inst.getValue(), {
          key: meta.key,
          meta: [ { name: apps, url: url }, meta.key ],
          _: { creator: user.key, realm: realm, access: { get: 'all', set: 'creator', del: 'creator' } }
        } );

        // save app metadata and app configuration
        try {
          Promise.all( [
            ccm.store( { name: apps, url: url } ).then( store => store.set( meta ) ),
            ccm.store( { name: configs, url: url } ).then( store => store.set( config ) )
          ] ).then( response => {
            if ( response[ 0 ] !== meta.key || response[ 1 ] !== meta.key ) return;
            document.querySelector( '#app-creation-form' ).reset();
            sessionStorage.removeItem( 'dms-apps' );
            document.querySelector( '#create-app-success a' ).setAttribute( 'href', './app.html?id=' + meta.key )
            $( '#create-app-success' ).modal( 'show' );
          } );
        } catch( e ) {
          $( '#app-creation' ).modal( 'show' );
        }

      }

    }

    /**
     * gets all apps or component or tools data (tools are only highest versions of components)
     * @param {string} key - item key in the Session Storage where the items are stored
     * @returns {Object[]}
     */
    function getItems( key ) {
      if ( !items[ key ] )
        items[ key ] = JSON.parse( sessionStorage.getItem( key ) );
      return items[ key ];
    }

    /** removes all global loaded external Bootstrap and Materialize CSS of the webpage */
    function cleanHead() {
      document.head.querySelectorAll( 'link[href^="https"]' ).forEach( link => {
        if ( link.getAttribute( 'href' ).includes( 'bootstrap' ) || link.getAttribute( 'href' ).includes( 'materialize' ) )
          document.head.removeChild( link );
      } );
    }

    /** displays the user in frontend as logged in */
    function showLoggedIn() {

      // show user in frontend
      document.querySelector( '#username' ).innerText = user.name;
      document.querySelector( '#user img' ).setAttribute( 'src', user.picture || './img/user.jpg' );

      // hide and show correct buttons in the user dropdown
      document.querySelector( '#login-btn' ).style.display = 'none';
      document.querySelector( '#register-btn' ).style.display = 'none';
      document.querySelector( '#my-apps-btn' ).style.display = 'inherit';
      document.querySelector( '#profile-btn' ).style.display = 'inherit';
      document.querySelector( '#logout-btn' ).style.display = 'inherit';

    }

    /** displays the user in frontend as logged out */
    function showLoggedOut() {

      // remove user in frontend
      document.querySelector( '#username' ).innerText = '';
      document.querySelector( '#user img' ).setAttribute( 'src', './img/user.jpg' );

      // show login and register button and hide logout button
      document.querySelector( '#login-btn' ).style.display = 'inherit';
      document.querySelector( '#register-btn' ).style.display = 'inherit';
      document.querySelector( '#my-apps-btn' ).style.display = 'none';
      document.querySelector( '#profile-btn' ).style.display = 'none';
      document.querySelector( '#logout-btn' ).style.display = 'none';

    }

    /** makes the modal dialogs movable via drag'n'drop */
    function movableModals() {
      $( '.modal-header' ).on( 'mousedown', function ( mousedownEvt ) {
        const $draggable = $( this );
        const $body = $( 'body' );
        const x = mousedownEvt.pageX - $draggable.offset().left;
        const y = mousedownEvt.pageY - $draggable.offset().top;
        $body.on( 'mousemove.draggable', mousemoveEvt => {
          $draggable.closest( '.modal-dialog' ).offset( {
            "left": mousemoveEvt.pageX - x,
            "top": mousemoveEvt.pageY - y
          } );
        } );
        $body.one( 'mouseup', () => $body.off( 'mousemove.draggable' ) );
        $draggable.closest( '.modal' ).one( 'bs.modal.hide', () => $body.off( 'mousemove.draggable' ) );
      } );
    }

    /**
     * renders a red text message in a webpage area with a fadeout effect
     * @param {HTMLElement} elem - webpage area
     * @param {string} message - text message
     */
    function renderHint( elem, message ) {
      elem.innerHTML = `<span class="text-danger text-center">${message}</span>`;
      setTimeout( () => elem.querySelector( 'span' ).classList.add( 'fadeout' ), 100 );
    }

  }

} )();