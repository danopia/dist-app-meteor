# Build image: https://github.com/disney/meteor-base
# Example: https://github.com/disney/meteor-base/blob/main/example/default.dockerfile

# The tag here should match the Meteor version of your app, per .meteor/release
FROM geoffreybooth/meteor-base:2.7.3 AS build
WORKDIR /opt/src

COPY ./package*.json ./
RUN meteor npm ci

# Copy piecemeal to help with caching
COPY .meteor ./.meteor
COPY client ./client
COPY imports ./imports
COPY server ./server
COPY tests ./tests
COPY public ./public
COPY tsconfig.json ./tsconfig.json
RUN meteor build --directory /opt/bundle --server-only


# Use the specific version of Node expected by your Meteor release, `meteor node --version`
FROM node:14.19.3-alpine
# bash is for /docker/entrypoint.sh etc
RUN apk --no-cache add bash ca-certificates

ENV NODE_ENV production
ENV APP_BUNDLE_FOLDER /opt/bundle
ENV SCRIPTS_FOLDER /docker
WORKDIR /opt/bundle/bundle

COPY --from=build $SCRIPTS_FOLDER $SCRIPTS_FOLDER/

# for temporary use:
# COPY data ./data

COPY --from=build $APP_BUNDLE_FOLDER/bundle/programs/server/package*.json ./programs/server/
RUN cd programs/server && npm install --production

COPY --from=build $APP_BUNDLE_FOLDER/bundle ./

ENTRYPOINT ["/docker/entrypoint.sh"]
CMD ["node", "main.js"]
