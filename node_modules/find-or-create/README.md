# FindOrCreate v2.0 for Mongoose
### Extend the mongoose schemas with a findOrCreate() plugin. Essentially, if a document is not found, will be atomically created or (if specified) updated

### Install it with:

    npm i find-or-create

### **Examples**:

```javascript
yourSchema.statics.findOrCreate = require("find-or-create");
YourModel = mongoose.model("yourSchema", yourSchema);

YourModel.findOrCreate({_id: myID}, {apples: 2}, (err, result) => {
    if (err) return console.error(err);
    console.log(result.doc); // the document itself
    console.log(result.isNew); // if the document has just been created
});
```

Example upserting the document and using the promise return:

```javascript
Model.findOrCreate({_id: myID, apples: 2}, {apples: 5}, {upsert: true})
.then((result) => {
    console.log(result.doc);
    console.log(result.isNew);
})
.catch(console.error);
```

## Note:

As of Mongoose v5, to use this module you need to set the global option `useFindAndModify` to _false_, otherwise a warning will be logged.

Example:
```
mongoose.connect(uri, { useFindAndModify: false });
```

## Upgrading to Mongoose 5:

The latest v2.0 of this plugin is compatible with Mongoose 5.x.
If you need retro-compatibility with Mongoose 4.x, please install the version 1.1 of this module.


---
## API:

```javascript
MongooseModel.findOrCreate(query, doc, [options, callback]);
```
If you don't specify a callback, it will be returned a promise.

---

- **doc** is the document that will be inserted if the document based on your **query** is not found, otherwise the record will be updated with the new document (if upsert is enabled).

- **options** is an optional object that will be passed to the underlying mongoose 'findOrCreate' method.

    You can find the possible options here: http://mongoosejs.com/docs/api.html#query_Query-findOneAndUpdate

    Set `{upsert: true}` to update the document when it already exists, otherwhise it will be only inserted when not found


---
## Test with

```bash
npm test
```

---
## License

MIT
