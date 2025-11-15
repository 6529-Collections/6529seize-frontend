export interface XtdhGrantorProfile {
  readonly id?: string;
  readonly handle?: string;
  readonly avatar?: string;
}

export interface XtdhToken {
  readonly contract: string;
  readonly tokenId: string;
  readonly xtdhRate: number;
  readonly xtdhTotal: number;
  readonly topGrantor?: XtdhGrantorProfile;
}

export interface XtdhTokenContributor {
  readonly xtdhRate: number;
  readonly xtdhTotal: number;
  readonly grantor?: XtdhGrantorProfile;
}

export interface XtdhTokenPage {
  readonly tokens: XtdhToken[];
  readonly page: number;
  readonly hasNextPage: boolean;
}
