import Vue from 'vue'
import Vuex from 'vuex'
import VuexORM from 'app/index'
import Utils from 'app/support/Utils'
import Database from 'app/database/Database'
import NoKey from 'app/schema/NoKey'

Vue.use(Vuex)

/**
 * Create a new Vuex Store.
 */
export function createStore (entities, namespace) {
  const database = new Database()

  entities.forEach((entity) => {
    database.register(entity.model, entity.module || {})
  })

  return new Vuex.Store({
    plugins: [VuexORM.install(database, { namespace })],
    strict: true
  })
}

/**
 * Create a new Vuex State.
 */
export function createState (state, namespace = 'entities') {
  return {
    $name: namespace,

    ...Utils.mapValues(state, (data, name) => {
      return {
        $connection: namespace,
        $name: name,
        data
      }
    })
  }
}

export function refreshNoKey () {
  NoKey.count = 0
}

export default {
  createStore,
  createState,
  refreshNoKey
}
