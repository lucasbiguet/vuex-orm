import { createStore, createState } from 'test/support/Helpers'
import Model from 'app/model/Model'

describe('Features – Relations – Morph To', () => {
  it('can create data containing the morph to relation', () => {
    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          comment: this.morphOne(Comment, 'commentable_id', 'commentable_type')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          body: this.attr(''),
          commentable_id: this.attr(null),
          commentable_type: this.attr(null),
          commentable: this.morphTo('commentable_id', 'commentable_type')
        }
      }
    }

    const store = createStore([{ model: Post }, { model: Comment }])

    store.dispatch('entities/comments/create', {
      data: {
        id: 1,
        body: 'The Body',
        commentable_type: 'posts',
        commentable_id: 1,
        commentable: { id: 1 }
      }
    })

    const expected = createState({
      posts: {
        1: { $id: 1, id: 1, comment: null }
      },
      comments: {
        1: {
          $id: 1,
          id: 1,
          body: 'The Body',
          commentable_type: 'posts',
          commentable_id: 1,
          commentable: {
            $id: null, comment: null, id: 1
          }
        }
      }
    })

    expect(store.state.entities).toEqual(expected)
  })

  it('can retrieve all morph relations', async () => {
    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          comments: this.morphMany(Comment, 'commentable_id', 'commentable_type')
        }
      }
    }

    class Video extends Model {
      static entity = 'videos'

      static fields () {
        return {
          id: this.attr(null),
          comments: this.morphMany(Comment, 'commentable_id', 'commentable_type')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          body: this.attr(''),
          commentable_id: this.attr(null),
          commentable_type: this.attr(null),
          commentable: this.morphTo('commentable_id', 'commentable_type')
        }
      }
    }

    const store = createStore([{ model: Post }, { model: Video }, { model: Comment }])

    await store.dispatch('entities/posts/insert', {
      data: {
        id: 1,
        comments: [
          { id: 1, body: 'comment1' },
          { id: 2, body: 'comment2' }
        ]
      }
    })

    await store.dispatch('entities/videos/insert', {
      data: {
        id: 1,
        comments: [
          { id: 3, body: 'comment3' },
          { id: 4, body: 'comment4' }
        ]
      }
    })

    const comments = store.getters['entities/comments/query']().with('commentable').get()

    expect(comments.length).toBe(4)
    expect(comments[0]).toBeInstanceOf(Comment)
    expect(comments[0].commentable).toBeInstanceOf(Post)
    expect(comments[2]).toBeInstanceOf(Comment)
    expect(comments[2].commentable).toBeInstanceOf(Video)
  })

  it('can resolve empty morph to relations', async () => {
    class Post extends Model {
      static entity = 'posts'

      static fields () {
        return {
          id: this.attr(null),
          comments: this.morphMany(Comment, 'commentable_id', 'commentable_type')
        }
      }
    }

    class Video extends Model {
      static entity = 'videos'

      static fields () {
        return {
          id: this.attr(null),
          comments: this.morphMany(Comment, 'commentable_id', 'commentable_type')
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static fields () {
        return {
          id: this.attr(null),
          body: this.attr(''),
          commentable_id: this.attr(null),
          commentable_type: this.attr(null),
          commentable: this.morphTo('commentable_id', 'commentable_type')
        }
      }
    }

    const store = createStore([{ model: Post }, { model: Video }, { model: Comment }])

    await store.dispatch('entities/comments/insert', {
      data: {
        id: 1,
        body: 'Body 01'
      }
    })

    const comment = store.getters['entities/comments/query']().with('commentable').find(1)

    expect(comment.commentable).toBe(null)
  })

  it('can retrieve morph to relations based on composite key', async () => {
    class Post extends Model {
      static entity = 'posts'

      static primaryKey = ['workspace_id', 'id']

      static fields () {
        return {
          id: this.attr(null),
          workspace_id: this.attr(null)
        }
      }
    }

    class Video extends Model {
      static entity = 'videos'

      static primaryKey = ['workspace_id', 'id']

      static fields () {
        return {
          id: this.attr(null),
          workspace_id: this.attr(null)
        }
      }
    }

    class Comment extends Model {
      static entity = 'comments'

      static primaryKey = ['workspace_id', 'id']

      static fields () {
        return {
          id: this.attr(null),
          workspace_id: this.attr(null),
          body: this.attr(''),
          commentable_id: this.attr(null),
          commentable_type: this.attr(null),
          commentable: this.morphTo(['workspace_id', 'commentable_id'], 'commentable_type')
        }
      }
    }

    const store = createStore([{ model: Post }, { model: Video }, { model: Comment }])

    await store.dispatch('entities/posts/insert', {
      data: {
        id: 1,
        workspace_id: 1
      }
    })

    await store.dispatch('entities/videos/insert', {
      data: {
        id: 1,
        workspace_id: 1
      }
    })

    await store.dispatch('entities/comments/insert', {
      data: [
        {
          id: 1,
          workspace_id: 1,
          body: 'comment1',
          commentable_type: 'posts',
          commentable_id: 1
        },
        {
          id: 2,
          workspace_id: 1,
          body: 'comment2',
          commentable_type: 'posts',
          commentable_id: 1
        },
        {
          id: 3,
          workspace_id: 1,
          body: 'comment3',
          commentable_type: 'videos',
          commentable_id: 1
        },
        {
          id: 4,
          workspace_id: 1,
          body: 'comment4',
          commentable_type: 'videos',
          commentable_id: 1
        }
      ]
    })

    const comments = store.getters['entities/comments/query']().with('commentable').get()

    expect(comments.length).toBe(4)
    expect(comments[0]).toBeInstanceOf(Comment)
    expect(comments[0].commentable).toBeInstanceOf(Post)
    expect(comments[2]).toBeInstanceOf(Comment)
    expect(comments[2].commentable).toBeInstanceOf(Video)
  })
})
