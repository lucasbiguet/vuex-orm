import { Schema as NormalizrSchema } from 'normalizr'
import Schema from '../../schema/Schema'
import { Record, NormalizedData, Collection } from '../../data'
import Model from '../../model/Model'
import Query from '../../query/Query'
import Constraint from '../../query/contracts/RelationshipConstraint'
import DictionaryMany from '../contracts/DictionaryMany'
import Relation from './Relation'
import Utils from '../../support/Utils'

export default class HasMany extends Relation {
  /**
   * The related model.
   */
  related: typeof Model

  /**
   * The foreign key of the related model.
   */
  foreignKey: string[]

  /**
   * The local key of the model.
   */
  localKey: string

  /**
   * Create a new has many instance.
   */
  constructor (model: typeof Model, related: typeof Model | string, foreignKey: string | string[], localKey: string) {
    super(model) /* istanbul ignore next */

    this.related = this.model.relation(related)
    this.foreignKey = Array.isArray(foreignKey) ? foreignKey : [foreignKey]
    this.localKey = localKey
  }

  /**
   * Define the normalizr schema for the relationship.
   */
  define (schema: Schema): NormalizrSchema {
    return schema.many(this.related)
  }

  /**
   * Attach the relational key to the given data.
   */
  attach (key: any, record: Record, data: NormalizedData): void {
    key.forEach((index: any) => {
      const related = data[this.related.entity]

      this.foreignKey.forEach((foreignKey, i) => {
        if (!related || !related[index] || related[index][foreignKey] !== undefined) {
          return
        }

        const value = this.foreignKey.length > 1 ? record[this.localKey].split('_')[i] : record[this.localKey]

        related[index][foreignKey] = (typeof value === 'string') ? Utils.tryParseInt(value) : value
      })
    })
  }

  /**
   * Convert given value to the appropriate value for the attribute.
   */
  make (value: any, _parent: Record, _key: string): Model[] {
    return this.makeManyRelation(value, this.related)
  }

  /**
   * Load the has many relationship for the collection.
   */
  load (query: Query, collection: Collection, name: string, constraints: Constraint[]): void {
    const relation = this.getRelation(query, this.related.entity, constraints)

    this.addEagerConstraints(relation, collection)

    this.match(collection, relation.get(), name)
  }

  /**
   * Set the constraints for an eager load of the relation.
   */
  private addEagerConstraints (relation: Query, collection: Collection): void {
    this.foreignKey.forEach((foreignKey, i) => {
      const key = Array.isArray(this.model.primaryKey) ? this.model.primaryKey[i] : this.model.primaryKey

      relation.whereFk(foreignKey, this.getKeys(collection, key))
    })
  }

  /**
   * Match the eagerly loaded results to their parents.
   */
  private match (collection: Collection, relations: Collection, name: string): void {
    const dictionary = this.buildDictionary(relations)

    collection.forEach((model) => {
      const id = model[this.localKey]
      const relation = dictionary[id]

      model[name] = relation || []
    })
  }

  /**
   * Build model dictionary keyed by the relation's foreign key.
   */
  private buildDictionary (relations: Collection): DictionaryMany {
    return relations.reduce<DictionaryMany>((dictionary, relation) => {
      const key = Utils.concatValues(relation, this.foreignKey)

      if (!dictionary[key]) {
        dictionary[key] = []
      }

      dictionary[key].push(relation)

      return dictionary
    }, {})
  }
}
