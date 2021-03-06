import { createStore, createState } from 'test/support/Helpers'
import Model from 'app/model/Model'

describe('Feature – Relations – Belongs To Many – Persist', () => {
  it('can create a data with belongs to many relation', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          permissions: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null)
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await store.dispatch('entities/users/create', {
      data: {
        id: 1,
        permissions: [{ id: 1 }, { id: 2 }]
      }
    })

    const expected = createState({
      users: {
        1: { $id: 1, id: 1, permissions: [] }
      },
      roles: {
        1: { $id: 1, id: 1 },
        2: { $id: 2, id: 2 }
      },
      roleUser: {
        '[1,1]': { $id: [1, 1], role_id: 1, user_id: 1 },
        '[2,1]': { $id: [2, 1], role_id: 2, user_id: 1 }
      }
    })

    expect(store.state.entities).toEqual(expected)
  })

  it('can create a data without relation', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null)
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await store.dispatch('entities/users/create', { data: { id: 1 } })

    const expected = createState({
      users: {
        1: { $id: 1, id: 1, roles: [] }
      },
      roles: {},
      roleUser: {}
    })

    expect(store.state.entities).toEqual(expected)
  })

  it('can create a belongs to many relation data with increment id set on pivot model', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null),
          users: this.belongsToMany(User, RoleUser, 'role_id', 'user_id')
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          id: this.increment(),
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await User.create({
      data: {
        id: 1,
        roles: [
          { id: 2 },
          { id: 3 }
        ]
      }
    })

    expect(store.state.entities.users.data['1'].id).toBe(1)
    expect(store.state.entities.roles.data['2'].id).toBe(2)
    expect(store.state.entities.roles.data['3'].id).toBe(3)
    expect(store.state.entities.roleUser.data['[2,1]'].id).toBe(1)
    expect(store.state.entities.roleUser.data['[3,1]'].id).toBe(2)
  })

  it('can create a belongs to many relation data with increment id set on base models', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.increment(),
          name: this.string(''),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.increment(),
          name: this.string(''),
          users: this.belongsToMany(User, RoleUser, 'role_id', 'user_id')
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await User.create({
      data: {
        name: 'John Doe',
        roles: [
          { name: 'view-post' },
          { name: 'view-comment' }
        ]
      }
    })

    const expected = createState({
      users: {
        1: { $id: 1, id: 1, name: 'John Doe', roles: [] }
      },
      roles: {
        1: { $id: 1, id: 1, name: 'view-post', users: [] },
        2: { $id: 2, id: 2, name: 'view-comment', users: [] }
      },
      roleUser: {
        '[1,1]': { $id: [1, 1], role_id: 1, user_id: 1 },
        '[2,1]': { $id: [2, 1], role_id: 2, user_id: 1 }
      }
    })

    expect(store.state.entities).toEqual(expected)
  })

  it('can create a belongs to many relation data from nested data', async () => {
    class Team extends Model {
      static entity = 'teams'

      static fields () {
        return {
          id: this.attr(null),
          users: this.hasMany(User, 'team_id')
        }
      }
    }

    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          team_id: this.attr(null),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null),
          users: this.belongsToMany(User, RoleUser, 'role_id', 'user_id')
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: Team }, { model: User }, { model: Role }, { model: RoleUser }])

    await Team.create({
      data: {
        id: 1,
        users: [{
          team_id: 1,
          id: 1,
          roles: [
            { id: 2 },
            { id: 3 }
          ]
        }]
      }
    })

    expect(store.state.entities.teams.data['1'].id).toBe(1)
    expect(store.state.entities.users.data['1'].id).toBe(1)
    expect(store.state.entities.roles.data['2'].id).toBe(2)
    expect(store.state.entities.roles.data['3'].id).toBe(3)
    expect(store.state.entities.roleUser.data['[2,1]'].$id).toStrictEqual([2, 1])
    expect(store.state.entities.roleUser.data['[3,1]'].$id).toStrictEqual([3, 1])
  })

  it('can retrieve data by filtering with `whereHas`', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null)
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUser'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null)
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await store.dispatch('entities/users/create', {
      data: [{ id: 1 }, { id: 2 }]
    })

    await store.dispatch('entities/roles/create', {
      data: [{ id: 1 }, { id: 2 }]
    })

    await store.dispatch('entities/roleUser/create', {
      data: [{ role_id: 1, user_id: 1 }, { role_id: 2, user_id: 2 }]
    })

    const users = store.getters['entities/users/query']().whereHas('roles', (query) => {
      query.where('id', 2)
    }).get()

    expect(users.length).toBe(1)
    expect(users[0].id).toBe(2)
  })

  it('can create a data to pivot table with field', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          name: this.attr(''),
          roleUsers: this.hasMany(RoleUser, 'user_id'),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null),
          roleUsers: this.hasMany(RoleUser, 'role_id'),
          users: this.belongsToMany(User, RoleUser, 'role_id', 'user_id')
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUsers'

      static primaryKey = 'id'

      static fields () {
        return {
          id: this.attr(null),
          role_id: this.attr(null),
          user_id: this.attr(null),
          type: this.attr(''),
          user: this.belongsTo(User, 'user_id'),
          role: this.belongsTo(Role, 'role_id')
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await store.dispatch('entities/users/insertOrUpdate', {
      data: {
        id: 1,
        name: 'Jane Doe',
        roleUsers: [
          {
            id: 1,
            role_id: 1,
            user_id: 1,
            type: 'administrator'
          },
          {
            id: 2,
            role_id: 1,
            user_id: 1,
            type: 'general'
          },
          {
            id: 3,
            role_id: 2,
            user_id: 1,
            type: 'general'
          }
        ],
        roles: [
          { id: 1 },
          { id: 2 }
        ]
      }
    })

    const expected = createState({
      users: {
        1: { $id: 1, id: 1, name: 'Jane Doe', roleUsers: [], roles: [] }
      },
      roles: {
        1: { $id: 1, id: 1, roleUsers: [], users: [] },
        2: { $id: 2, id: 2, roleUsers: [], users: [] }
      },
      roleUsers: {
        1: { $id: 1, id: 1, user_id: 1, role_id: 1, type: 'administrator', user: null, role: null },
        2: { $id: 2, id: 2, user_id: 1, role_id: 1, type: 'general', user: null, role: null },
        3: { $id: 3, id: 3, user_id: 1, role_id: 2, type: 'general', user: null, role: null }
      }
    })

    expect(store.state.entities).toEqual(expected)
  })

  it('can create a data to pivot table with field using composite key', async () => {
    class User extends Model {
      static entity = 'users'

      static fields () {
        return {
          id: this.attr(null),
          name: this.attr(''),
          roleUsers: this.hasMany(RoleUser, 'user_id'),
          roles: this.belongsToMany(Role, RoleUser, 'user_id', 'role_id')
        }
      }
    }

    class Role extends Model {
      static entity = 'roles'

      static fields () {
        return {
          id: this.attr(null),
          roleUsers: this.hasMany(RoleUser, 'role_id'),
          users: this.belongsToMany(User, RoleUser, 'role_id', 'user_id')
        }
      }
    }

    class RoleUser extends Model {
      static entity = 'roleUsers'

      static primaryKey = ['role_id', 'user_id']

      static fields () {
        return {
          role_id: this.attr(null),
          user_id: this.attr(null),
          type: this.attr(''),
          user: this.belongsTo(User, 'user_id'),
          role: this.belongsTo(Role, 'role_id')
        }
      }
    }

    const store = createStore([{ model: User }, { model: Role }, { model: RoleUser }])

    await store.dispatch('entities/users/insertOrUpdate', {
      data: {
        id: 1,
        name: 'Jane Doe',
        roleUsers: [
          {
            role_id: 1,
            user_id: 1,
            type: 'administrator'
          },
          {
            role_id: 2,
            user_id: 1,
            type: 'general'
          }
        ],
        roles: [
          { id: 1 },
          { id: 2 }
        ]
      }
    })

    const expected = createState({
      users: {
        1: { $id: 1, id: 1, name: 'Jane Doe', roleUsers: [], roles: [] }
      },
      roles: {
        1: { $id: 1, id: 1, roleUsers: [], users: [] },
        2: { $id: 2, id: 2, roleUsers: [], users: [] }
      },
      roleUsers: {
        '[1,1]': { $id: [1, 1], user_id: 1, role_id: 1, type: 'administrator', user: null, role: null },
        '[2,1]': { $id: [2, 1], user_id: 1, role_id: 2, type: 'general', user: null, role: null }
      }
    })

    expect(store.state.entities).toEqual(expected)
  })
})
