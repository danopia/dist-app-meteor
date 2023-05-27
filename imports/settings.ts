import { Meteor } from "meteor/meteor";

export const settings: {

  public: {
    marketUrl?: string;
  };

} = Meteor.settings;

export const marketUrl = settings.public.marketUrl
  ?? "ddp-catalog://dist-v1alpha1.deno.dev/public-index";
