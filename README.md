### Talkback issue demo

#### To run
```
yarn && yarn start & yarn start:backend
```

To check this run
```sh
curl -XPOST http://localhost:3200/posts \
  -H 'content-type: application/json' \
  -d '{"title": "Some post", "content": "Some content"}'
```
