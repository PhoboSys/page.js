import trim from 'lodash.trim'
import each from 'lodash.foreach'
import size from 'lodash.size'
import concat from 'lodash.concat'
import compact from 'lodash.compact'
import defaults from 'lodash.defaults'

import { map } from './utils'

import pagejs from './pagejs'
import {
  transitionRenderingMiddleware,
  transitionRoutingMiddlewares,
  createUrlParsingMiddleware
} from './middleware-factory'

function PageRouter (routesTree, middlewares, renderer, config) {
  var _routesTree = routesTree
  var _middlewares = middlewares
  var _renderer = renderer
  var _config = _addDefaultConfig(config || {})

  function _addDefaultConfig (config) {
    return defaults(
      config,
      {
        base: window.location.pathname + window.location.search
      }
    )
  }

  function _generatePath (routeBranch) {
    var path = compact(
      map(
        routeBranch,
        function(pmap) {
          return trim(pmap.path, '/')
        }
      )
    ).join('/')

    return '/' + path
  }

  function _registerRoute (routeBranch) {
    var routepath = _generatePath(routeBranch)
    var args = concat(
      [routepath],
      transitionRoutingMiddlewares(routepath, routeBranch),
      _middlewares,
      transitionRenderingMiddleware(_renderer)
    )
    PageRouter.page.apply(PageRouter.page, args)
  }

  function _registerRouteBranch (routeBranch, routemap) {
    routeBranch = routeBranch.concat(routemap)
    if (size(routemap.children) > 0) {
      each(
        routemap.children,
        function (route) {
          _registerRouteBranch(routeBranch, route)
        }
      )
    } else {
      _registerRoute(routeBranch)
    }
  }

  this.start = function _start () {
    PageRouter.page(createUrlParsingMiddleware())

    each(
      _routesTree,
      function(route) {
        _registerRouteBranch([], route)
      }
    )

    PageRouter.page.base(_config.base)
    PageRouter.page.start(_config)
  }
}

PageRouter.page = pagejs
PageRouter.init = function init (routesTree, middlewares, renderer, config) {
  var router = new PageRouter(routesTree, middlewares, renderer, config)
  router.start()
}

export default PageRouter

