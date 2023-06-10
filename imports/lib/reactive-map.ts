// revamp of https://github.com/lukejagodzinski/meteor-reactive-map/blob/master/lib/reactive_map.js

import { Tracker } from "meteor/tracker";

export class ReactiveMap<Tkey extends string, Tvalue> {
  private _values = new Map<Tkey, Tvalue>();

  /** Tracking the "size" method. */
  private _sizeDep = new Tracker.Dependency;
  /** Tracking "entries" and "all" methods. */
  private _entriesDep = new Tracker.Dependency;
  /** Tracking the "key" method. */
  private _keysDep = new Tracker.Dependency;
  /** Tracking the "values" method. */
  private _valuesDep = new Tracker.Dependency;
  /** Tracking key existence. */
  private _keysDeps = new Map<Tkey, Tracker.Dependency>();
  /** Tracking values under keys. */
  private _valuesDeps = new Map<Tkey, Tracker.Dependency>();

  constructor(data?: Map<Tkey, Tvalue>) {
    // Initialize a map.
    if (data) {
      this.set(data);
    }
  }

  _ensureKey(key: Tkey) {
    if (!this._valuesDeps.has(key)) {
      this._keysDeps.set(key, new Tracker.Dependency);
      this._valuesDeps.set(key, new Tracker.Dependency);
    }
  }

  // Getters.

  get(key: Tkey) {
    this._ensureKey(key);
    this._valuesDeps.get(key)?.depend();

    return this._values.get(key);
  }

  has(key: Tkey) {
    this._ensureKey(key);
    this._keysDeps.get(key)?.depend();

    return this._values.has(key);
  }

  entries() {
    this._entriesDep.depend();

    return this._values.entries();
  }

  all() {
    this._entriesDep.depend();

    return Object.fromEntries(this._values.entries());
  }

  keys() {
    this._keysDep.depend();

    return this._values.keys();
  }

  values() {
    this._valuesDep.depend();

    return this._values.values();
  }

  size() {
    this._sizeDep.depend();

    return this._values.size;
  }

  // Modifiers.

  private _setOne(key: Tkey, value: Tvalue) {
    if (this._values.has(key)) {
      if (value === this._values.get(key)) {
        return;
      }
      this._values.set(key, value);
    } else {
      this._values.set(key, value);

      this._sizeDep.changed();
      this._keysDep.changed();
      this._keysDeps.get(key)?.changed();
    }

    this._valuesDep.changed();
    this._entriesDep.changed();
    this._valuesDeps.get(key)?.changed();
  }

  private _setMany(values: Map<Tkey, Tvalue>) {
    var self = this;

    for (const [key, value] of values) {
      self._setOne(key, value);
    }
  }

  set(dict: Map<Tkey, Tvalue>): this;
  set(key: Tkey, value: Tvalue): this;
  set(): this {
    if (arguments.length === 1 && arguments[0] instanceof Map) {
      this._setMany.apply(this, arguments as any);
    } else if (arguments.length === 2) {
      this._setOne.apply(this, arguments as any);
    }

    return this;
  }

  delete(key: Tkey) {
    if (!this._values.has(key)) {
      return false;
    }

    this._values.delete(key);

    this._valuesDeps.get(key)?.changed();
    this._keysDeps.get(key)?.changed();
    this._sizeDep.changed();
    this._entriesDep.changed();
    this._keysDep.changed();
    this._valuesDep.changed();

    return true;
  }

  clear() {
    this._values = new Map();

    this._sizeDep.changed();
    this._entriesDep.changed();
    this._keysDep.changed();
    this._valuesDep.changed();

    for (const dep of this._keysDeps.values()) {
      dep.changed();
    }
    for (const dep of this._valuesDeps.values()) {
      dep.changed();
    }
  }
}
