/**
 * @overview data-based resources of ccm component for Digital Makerspace
 * @author André Kless <andre.kless@web.de> 2019-2021
 * @license The MIT License (MIT)
 */

ccm.files[ 'resources.js' ] = {

  /** live configuration */
  "live": {
    "add_version": true,
    "analytics": [ "ccm.component", "https://ccmjs.github.io/akless-components/dms_analytics/versions/ccm.dms_analytics-1.1.0.js", [ "ccm.get", "https://ccmjs.github.io/akless-components/dms_analytics/resources/configs.js", "live" ] ],
    "app_manager": [ "ccm.component", "https://ccmjs.github.io/akless-components/app_manager/versions/ccm.app_manager-2.0.1.js", [ "ccm.get", "https://ccmjs.github.io/akless-components/app_manager/resources/configs.js", "live" ] ],
    "apps": [ "ccm.store", { "name": "dms-apps", "url": "https://ccm2.inf.h-brs.de" } ],
    "css": [ "ccm.load",
      "https://ccmjs.github.io/digital-makerspace/old/2020/resources/css/dms.css",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
    ],
    "component_manager": [ "ccm.component", "https://ccmjs.github.io/akless-components/component_manager/versions/ccm.component_manager-4.0.0.js", [ "ccm.get", "https://ccmjs.github.io/akless-components/component_manager/resources/resources.js", "live" ] ],
    "components": [ "ccm.store", { "name": "dms-components", "url": "https://ccm2.inf.h-brs.de" } ],
    "default_icon": "https://ccmjs.github.io/digital-makerspace/old/2020/resources/img/default.png",
    "form": [ "ccm.component", "https://ccmjs.github.io/akless-components/submit/versions/ccm.submit-8.1.1.js", [ "ccm.get", "https://ccmjs.github.io/akless-components/submit/resources/configs.js", "component_meta_create" ] ],
    "html": [ "ccm.load", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/html/dms.html" ],
    "lang": [ "ccm.instance", "https://ccmjs.github.io/tkless-components/lang/versions/ccm.lang-1.0.0.js", [ "ccm.get", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/resources.js", "lang" ] ],
    "listing": {
      "apps": [ "ccm.component", "https://ccmjs.github.io/akless-components/listing/versions/ccm.listing-4.0.0.js", {
        "html": [ "ccm.load", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/html/listing_apps.html" ],
        "css": [ "ccm.load", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/css/listing_apps.css" ]
      } ],
      "components": [ "ccm.component", "https://ccmjs.github.io/akless-components/listing/versions/ccm.listing-4.0.0.js", {
        "html": [ "ccm.load", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/html/listing_components.html" ],
        "css": [ "ccm.load",
          "https://ccmjs.github.io/digital-makerspace/old/2020/resources/css/listing_components.css",
          "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
        ]
      } ]
    },
    "logger": [ "ccm.instance", "https://ccmjs.github.io/akless-components/log/versions/ccm.log-5.0.0.js", {
      "events": {
        "ready": {
          "browser": true,
          "event": true,
          "referrer": true,
          "session": true,
          "user.key": true,
          "website": true
        },
        "app": {
          "data.key": true,
          "data.path": true,
          "event": true,
          "session": true,
          "user.key": true
        },
        "component": {
          "data.path": true,
          "event": true,
          "session": true,
          "user.key": true
        },
        "publish": {
          "data.path": true,
          "event": true,
          "session": true,
          "user.key": true
        },
        "menu": {
          "data": true,
          "event": true,
          "session": true,
          "user.key": true
        }
      },
      "onfinish": {
        "store": {
          "settings": { "name": "dms-log", "url": "https://ccm2.inf.h-brs.de" },
          "permissions": {
            "creator": "akless",
            "realm": "cloud",
            "access": {
              "get": "all",
              "set": "creator",
              "del": "creator"
            }
          }
        }
      }
    } ],
    "logo": "https://ccmjs.github.io/digital-makerspace/old/2020/resources/img/component.png",
    "menu": [ "ccm.component", "https://ccmjs.github.io/akless-components/menu/versions/ccm.menu-3.0.0.js", [ "ccm.get", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/resources.js", "menu" ] ],
    "rating": {
      "apps": {
        "component": [ "ccm.component", "https://ccmjs.github.io/tkless-components/star_rating_result/versions/ccm.star_rating_result-5.0.0.js", {
          "css": [ "ccm.load",
            { "context": "head", "url": "https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" },
            "https://ccmjs.github.io/digital-makerspace/old/2020/resources/css/rating_apps.css"
          ]
        } ],
        "store": [ "ccm.store", { "name": "dms-apps-ratings", "url": "https://ccm2.inf.h-brs.de" } ]
      },
      "components": {
        "component": [ "ccm.component", "https://ccmjs.github.io/tkless-components/star_rating_result/versions/ccm.star_rating_result-5.0.0.js", {
          "css": [ "ccm.load",
            { "context": "head", "url": "https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css" },
            "https://ccmjs.github.io/digital-makerspace/old/2020/resources/css/rating_components.css"
          ]
        } ],
        "store": [ "ccm.store", { "name": "dms-components-ratings", "url": "https://ccm2.inf.h-brs.de" } ]
      }
    },
    "routing": [ "ccm.instance", "https://ccmjs.github.io/akless-components/routing/versions/ccm.routing-2.0.5.js", { "app": "dms" } ],
    "user": [ "ccm.start", "https://ccmjs.github.io/akless-components/user/versions/ccm.user-9.7.0.js", [ "ccm.get", "https://ccmjs.github.io/digital-makerspace/old/2020/resources/resources.js", "user" ] ]
  },

  /** configuration for multilingualism */
  "lang": {
    "translations": {
      "de": {
        "flag": "https://ccmjs.github.io/tkless-components/lang/resources/de.svg"
      },
      "en": {
        "flag": "https://ccmjs.github.io/tkless-components/lang/resources/en.svg"
      }
    },
    "active": "en"
  },

  /** configuration for header menu */
  "menu": {
    "css": [ "ccm.load", "https://ccmjs.github.io/akless-components/menu/resources/text.css" ],
    "data": {
      "entries": [
        { "id": "home",       "title": "home"       },
        { "id": "apps",       "title": "apps"       },
        { "id": "components", "title": "components" },
        { "id": "publish",    "title": "publish"    }
      ]
    },
    "lang": [ "ccm.instance", "https://ccmjs.github.io/tkless-components/lang/versions/ccm.lang-1.0.0.js", {
      "translations": {
        "de": {
          "apps": "Apps",
          "components": "Komponenten",
          "flag": "https://ccmjs.github.io/tkless-components/lang/resources/de.svg",
          "home": "Startseite",
          "publish": "Veröffentlichen"
        },
        "en": {
          "apps": "Apps",
          "components": "Components",
          "flag": "https://ccmjs.github.io/tkless-components/lang/resources/en.svg",
          "home": "Home",
          "publish": "Publish"
        }
      },
      "active": "en"
    } ],
    "selected": 3,
    "trigger_selected": true
  },

  /** configuration for user authentication */
  "user": {
    "hash": [ "ccm.load", { "url": "https://ccmjs.github.io/akless-components/modules/md5.mjs", "type": "module" } ],
    "realm": "cloud",
    "store": "dms-user",
    "title": "Please enter username and password",
    "url": "https://ccm2.inf.h-brs.de"
  }

};
