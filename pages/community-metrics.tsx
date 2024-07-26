import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col } from "react-bootstrap";
import Breadcrumb from "../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function CommunityMetrics() {
  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "Community Metrics" },
  ];

  return (
    <>
      <Head>
        <title>Community Metrics | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community Metrics | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community-metrics`}
        />
        <meta property="og:title" content="Community Metrics" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={`${styles.main} ${styles.tdhMain}`}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Container className="pt-4">
                <Row>
                  <Col>
                    <h1>
                      <span className="font-lightest">Community</span> Metrics
                    </h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3" id="background">
                  <Col>
                    <p>
                      <a href="#background">
                        <b>Background</b>
                      </a>
                    </p>
                    <p>
                      One of our mental models is that NFT collections are
                      publicly readable databases of people with similar
                      interests. For example, we believe that, statistically,
                      people who own The Memes NFTs might be more likely to be
                      interested in the principles of decentralization than
                      average.
                    </p>
                    <p>
                      We further believe that by seeing collector behavior
                      on-chain, we can further delineate different profiles. In
                      other words, someone who bought a few Meme Cards early and
                      then just held them is likely a different psychological
                      profile than an active buyer and seller.
                    </p>
                    <p>
                      We calculate and make available community wide (all of
                      them directly from public blockchain data) and we expect
                      to add more metrics over time. These metrics may be used
                      from time to time by us for allowlists, by others for
                      their own allowlists or by anyone for any purpose
                      whatsoever.
                    </p>
                    <p>
                      No metric is the &apos;correct&apos; metric. They are just
                      different ways to look at the community. We expect to
                      continue to add (but not subtract) metrics over time, in
                      the hope that some might be useful to others.
                    </p>
                    <p>
                      Our current view is that we can consolidate metrics for up
                      to 3 addresses via an on-chain delegation tool. This is
                      something we will review in a future release of these
                      metrics.
                    </p>
                    <p>
                      Note that there is no provision (or planned provision) for
                      staking or locking NFTs. We suggest that people use their
                      NFTs in the normal way they like and the metrics will just
                      reflect their actual actions.
                    </p>
                    <p id="definitions" className="pt-3">
                      <a href="#definitions">
                        <b>Metrics Definitions</b>
                      </a>
                    </p>
                    <p>
                      <b>Cards Collected:</b> This is the total number of The
                      Memes NFTs owned by an address
                    </p>
                    <p>
                      <b>Unique Memes:</b> The total number of unique The Meme
                      NFTs owned by an address
                    </p>
                    <p>
                      <b>Meme Sets:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      either for all SZNs or a specific SZN
                    </p>
                    <p>
                      <b>Meme Sets -1:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      excluding 1 card
                    </p>
                    <p>
                      <b>Meme Sets -2:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      excluding 2 cards
                    </p>
                    <p>
                      <b>Genesis Sets:</b> The total number of complete
                      &quot;sets&quot; of the first three Meme NFTs owned by an
                      address
                    </p>
                    <p>
                      <b>Purchases:</b> Number of NFTs (Memes or Gradient)
                      bought by an address
                    </p>
                    <p>
                      <b>Purchases (ETH):</b> Amount of ETH spent on those NFTs
                      by an address
                    </p>
                    <p>
                      <b>Sales:</b> Number of NFTs (Memes or Gradient) sold by
                      an address
                    </p>
                    <p>
                      <b>Sales (ETH):</b> Amount of ETH received by an address
                      from the NFT sales
                    </p>
                    <p>
                      <b>Transfers In:</b> The number of NFTs (Memes or
                      Gradient) transferred into an address
                    </p>
                    <p>
                      <b>Transfers Out:</b> The number of NFTs (Memes or
                      Gradient) transferred out of an address
                    </p>
                    <p>
                      <b>TDH (unweighted):</b> &quot;Total Days Held&quot; - The
                      total number of days that the NFTs (Memes or Gradients)
                      held in an address have been held by that address. Each
                      NFT-day counts as one. This figured is calculated daily at
                      00:00 Coordinated Universal Time (UTC).
                    </p>
                    <p>
                      <b>TDH (unboosted):</b> The TDH calculation above weighted
                      by the size of the card edition, with FirstGM edition size
                      (3,941) being weighted as 1.
                    </p>
                    <p>
                      So for the purposes of this calculation, SeizingJPG with
                      an edition size of 1,000 is weighted as 3.941
                      (3,941/1,000), Nakamoto Freedom is weighted as 13.136
                      (3,941/300) and Gradients are weighted as 39.020
                      (3,941/101)
                    </p>
                    <p>
                      <b>TDH:</b> &quot;TDH (unboosted)&quot; multiplied by a
                      fun qualitative factor based on which NFTS were collected.
                      The boosters are as follows:
                    </p>
                    <h5 className="text-white pt-3" id="tdh-1.3">
                      <a href="#tdh-1.3">
                        <u>TDH 1.3 (March 29, 2024 - present)</u>
                      </a>
                    </h5>
                    <br />
                    <p>
                      Higher of Category A and Category B Boosters, plus
                      Category C Boosters
                    </p>
                    <p>
                      <u>Category A</u>
                    </p>
                    <ol>
                      <li>A complete set of all Meme Cards: 1.35x</li>
                      <li>
                        Additional complete set of Meme Cards: 1.02x (up to a
                        maximum of 2 additional sets)
                      </li>
                    </ol>
                    <p>
                      <u>Category B</u>
                    </p>
                    These boosts are applied to the total TDH, not just to that
                    SZN&apos;s TDH
                    <ol>
                      <li>
                        SZN1:
                        <ol type="a">
                          <li>Complete Set: 1.05x or</li>
                          <li>Genesis Set: 1.01x and</li>
                          <li>Nakamoto Freedom: 1.01x</li>
                        </ol>
                      </li>
                      <li>SZN2: Complete Set: 1.05x</li>
                      <li>SZN3: Complete Set: 1.05x</li>
                      <li>SZN4: Complete Set: 1.05x</li>
                      <li>SZN5: Complete Set: 1.05x</li>
                      <li>SZN6: Complete Set: 1.05x</li>
                      <li>SZN7: Complete Set: 1.05x</li>
                    </ol>
                    <p>
                      <u>Category C</u>
                    </p>
                    <ol>
                      <li>
                        Gradient: 1.02x per Gradient (up to a maximum of 3
                        Gradients)
                      </li>
                    </ol>
                    <h5 className="text-white pt-3" id="tdh-1.2">
                      <a href="#tdh-1.2">
                        <u>TDH 1.2 (December 30, 2023 - March 28, 2024)</u>
                      </a>
                    </h5>
                    <br />
                    <p>
                      Higher of Category A and Category B Boosters, plus
                      Category C Boosters
                    </p>
                    <p>
                      <u>Category A</u>
                    </p>
                    <ol>
                      <li>A complete set of all Meme Cards: 1.25x</li>
                      <li>
                        Additional complete set of Meme Cards: 1.02x (up to a
                        maximum of 2 additional sets)
                      </li>
                    </ol>
                    <p>
                      <u>Category B</u>
                    </p>
                    These boosts are applied to the total TDH, not just to that
                    SZN&apos;s TDH
                    <ol>
                      <li>
                        SZN1:
                        <ol type="a">
                          <li>Complete Set: 1.05x or</li>
                          <li>Genesis Set: 1.01x and</li>
                          <li>Nakamoto Freedom: 1.01x</li>
                        </ol>
                      </li>
                      <li>SZN2: Complete Set: 1.05x</li>
                      <li>SZN3: Complete Set: 1.05x</li>
                      <li>SZN4: Complete Set: 1.05x</li>
                      <li>SZN5: Complete Set: 1.05x</li>
                    </ol>
                    <p>
                      <u>Category C</u>
                    </p>
                    <ol>
                      <li>
                        Gradient: 1.02x per Gradient (up to a maximum of 3
                        Gradients)
                      </li>
                      <li>
                        Identity: Boosts can be earned for both a&#41; and
                        b&#41; below:
                        <ol type="A">
                          <li>
                            1.03x on any address that is part of an active Seize
                            profile
                          </li>
                          <li>
                            1.01x for having an ENS domain/subdomain active on
                            all addresses in a consolidation
                          </li>
                        </ol>
                      </li>
                    </ol>
                    <h5 className="text-white pt-3" id="tdh-1.1">
                      <a href="#tdh-1.1">
                        <u>TDH 1.1 (July 14, 2023 - December 29, 2023)</u>
                      </a>
                    </h5>
                    <br />
                    <p>
                      Higher of Category A and Category B Boosters, plus
                      Category C Boosters
                    </p>
                    <p>
                      <u>Category A</u>
                    </p>
                    <ol>
                      <li>A complete set of all Meme Cards: 1.20x</li>
                      <li>
                        Additional complete set of Meme Cards: 1.02x (up to a
                        maximum of 2 additional sets)
                      </li>
                    </ol>
                    <p>
                      <u>Category B</u>
                    </p>
                    <ol>
                      <li>
                        SZN1:
                        <ol type="a">
                          <li>Complete Set: 1.05x or</li>
                          <li>Genesis Set: 1.01x and</li>
                          <li>Nakamoto Freedom: 1.01x</li>
                        </ol>
                      </li>
                      <li>SZN2: Complete Set: 1.05x</li>
                      <li>SZN3: Complete Set: 1.05x</li>
                      <li>SZN4: Complete Set: 1.05x</li>
                    </ol>
                    <p>
                      <u>Category C</u>
                    </p>
                    <ol>
                      <li>
                        Gradient: 1.02x per Gradient (up to a maximum of 3
                        Gradients)
                      </li>
                      <li>
                        1.02x for having an ENS domain/subdomain active on all
                        addresses in a consolidation. The purpose of this boost
                        is to improve legibility of the collector profiles. The
                        ENS domain can be anonymous or pseudo.
                      </li>
                    </ol>
                    <br />
                    <br />
                    <h5 className="text-white pt-3" id="tdh-1.0">
                      <a href="#tdh-1.0">
                        <u>TDH 1.0 (January 30, 2023 - July 13, 2023)</u>
                      </a>
                    </h5>
                    <br />
                    &#40;1&#41;
                    <table className={styles.communityMetricsTable}>
                      <tbody>
                        <tr>
                          <td>A complete set of Meme Cards</td>
                          <td>1.20x</td>
                        </tr>
                        <tr>
                          <td>+ 0.02x for each additional Meme Card set</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>and</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>+ 0.02x for each Gradient</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>with a max of 1.30x</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                    <p>
                      <b>or</b>
                    </p>
                    &#40;2&#41;
                    <table className={styles.communityMetricsTable}>
                      <tbody>
                        <tr>
                          <td>A complete set of Meme Cards - 1</td>
                          <td>1.05x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 2</td>
                          <td>1.04x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 3</td>
                          <td>1.03x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 4</td>
                          <td>1.02x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 5</td>
                          <td>1.01x</td>
                        </tr>
                        <tr>
                          <td>
                            A complete set of genesis cards (cards 1 to 3)
                          </td>
                          <td>1.02x</td>
                        </tr>
                      </tbody>
                    </table>
                    <p>
                      <b>or</b>
                    </p>
                    &#40;3&#41;
                    <table className={styles.communityMetricsTable}>
                      <tbody>
                        <tr>
                          <td>
                            A complete set of genesis cards (cards 1 to 3):
                          </td>
                          <td>1.02x</td>
                        </tr>
                      </tbody>
                    </table>
                    <p>
                      Each address uses the highest value that it is eligible
                      for from #1, #2 or #3
                    </p>
                    <br />
                    <p id="levels">
                      <a href="#levels">
                        <b>Levels:</b>
                      </a>{" "}
                      TDH and rep are added together and the level is determined
                      by the table below. It is our most integrated measure of
                      trust in our ecosystem. Rep is not live yet so for this
                      initial release, levels are determined solely by TDH.
                    </p>
                    <table className={styles.communityMetricsTable}>
                      <thead>
                        <tr>
                          <th>TDH</th>
                          <th>Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>0</td>
                          <td>0</td>
                        </tr>
                        <tr>
                          <td>25</td>
                          <td>1</td>
                        </tr>
                        <tr>
                          <td>50</td>
                          <td>2</td>
                        </tr>
                        <tr>
                          <td>100</td>
                          <td>3</td>
                        </tr>
                        <tr>
                          <td>250</td>
                          <td>4</td>
                        </tr>
                        <tr>
                          <td>500</td>
                          <td>5</td>
                        </tr>
                        <tr>
                          <td>1000</td>
                          <td>6</td>
                        </tr>
                        <tr>
                          <td>1500</td>
                          <td>7</td>
                        </tr>
                        <tr>
                          <td>3000</td>
                          <td>8</td>
                        </tr>
                        <tr>
                          <td>5000</td>
                          <td>9</td>
                        </tr>
                        <tr>
                          <td>7500</td>
                          <td>10</td>
                        </tr>
                        <tr>
                          <td>10000</td>
                          <td>11</td>
                        </tr>
                        <tr>
                          <td>15000</td>
                          <td>12</td>
                        </tr>
                        <tr>
                          <td>20000</td>
                          <td>13</td>
                        </tr>
                        <tr>
                          <td>25000</td>
                          <td>14</td>
                        </tr>
                        <tr>
                          <td>30000</td>
                          <td>15</td>
                        </tr>
                        <tr>
                          <td>35000</td>
                          <td>16</td>
                        </tr>
                        <tr>
                          <td>40000</td>
                          <td>17</td>
                        </tr>
                        <tr>
                          <td>45000</td>
                          <td>18</td>
                        </tr>
                        <tr>
                          <td>50000</td>
                          <td>19</td>
                        </tr>
                        <tr>
                          <td>60000</td>
                          <td>20</td>
                        </tr>
                        <tr>
                          <td>70000</td>
                          <td>21</td>
                        </tr>
                        <tr>
                          <td>80000</td>
                          <td>22</td>
                        </tr>
                        <tr>
                          <td>90000</td>
                          <td>23</td>
                        </tr>
                        <tr>
                          <td>100000</td>
                          <td>24</td>
                        </tr>
                        <tr>
                          <td>110000</td>
                          <td>25</td>
                        </tr>
                        <tr>
                          <td>120000</td>
                          <td>26</td>
                        </tr>
                        <tr>
                          <td>130000</td>
                          <td>27</td>
                        </tr>
                        <tr>
                          <td>140000</td>
                          <td>28</td>
                        </tr>
                        <tr>
                          <td>150000</td>
                          <td>29</td>
                        </tr>
                        <tr>
                          <td>160000</td>
                          <td>30</td>
                        </tr>
                        <tr>
                          <td>170000</td>
                          <td>31</td>
                        </tr>
                        <tr>
                          <td>180000</td>
                          <td>32</td>
                        </tr>
                        <tr>
                          <td>190000</td>
                          <td>33</td>
                        </tr>
                        <tr>
                          <td>200000</td>
                          <td>34</td>
                        </tr>
                        <tr>
                          <td>220000</td>
                          <td>35</td>
                        </tr>
                        <tr>
                          <td>240000</td>
                          <td>36</td>
                        </tr>
                        <tr>
                          <td>260000</td>
                          <td>37</td>
                        </tr>
                        <tr>
                          <td>280000</td>
                          <td>38</td>
                        </tr>
                        <tr>
                          <td>300000</td>
                          <td>39</td>
                        </tr>
                        <tr>
                          <td>320000</td>
                          <td>40</td>
                        </tr>
                        <tr>
                          <td>340000</td>
                          <td>41</td>
                        </tr>
                        <tr>
                          <td>360000</td>
                          <td>42</td>
                        </tr>
                        <tr>
                          <td>380000</td>
                          <td>43</td>
                        </tr>
                        <tr>
                          <td>400000</td>
                          <td>44</td>
                        </tr>
                        <tr>
                          <td>420000</td>
                          <td>45</td>
                        </tr>
                        <tr>
                          <td>440000</td>
                          <td>46</td>
                        </tr>
                        <tr>
                          <td>460000</td>
                          <td>47</td>
                        </tr>
                        <tr>
                          <td>480000</td>
                          <td>48</td>
                        </tr>
                        <tr>
                          <td>500000</td>
                          <td>49</td>
                        </tr>
                        <tr>
                          <td>550000</td>
                          <td>50</td>
                        </tr>
                        <tr>
                          <td>600000</td>
                          <td>51</td>
                        </tr>
                        <tr>
                          <td>650000</td>
                          <td>52</td>
                        </tr>
                        <tr>
                          <td>700000</td>
                          <td>53</td>
                        </tr>
                        <tr>
                          <td>750000</td>
                          <td>54</td>
                        </tr>
                        <tr>
                          <td>800000</td>
                          <td>55</td>
                        </tr>
                        <tr>
                          <td>850000</td>
                          <td>56</td>
                        </tr>
                        <tr>
                          <td>900000</td>
                          <td>57</td>
                        </tr>
                        <tr>
                          <td>950000</td>
                          <td>58</td>
                        </tr>
                        <tr>
                          <td>1000000</td>
                          <td>59</td>
                        </tr>
                        <tr>
                          <td>1250000</td>
                          <td>60</td>
                        </tr>
                        <tr>
                          <td>1500000</td>
                          <td>61</td>
                        </tr>
                        <tr>
                          <td>1750000</td>
                          <td>62</td>
                        </tr>
                        <tr>
                          <td>2000000</td>
                          <td>63</td>
                        </tr>
                        <tr>
                          <td>2250000</td>
                          <td>64</td>
                        </tr>
                        <tr>
                          <td>2500000</td>
                          <td>65</td>
                        </tr>
                        <tr>
                          <td>2750000</td>
                          <td>66</td>
                        </tr>
                        <tr>
                          <td>3000000</td>
                          <td>67</td>
                        </tr>
                        <tr>
                          <td>3250000</td>
                          <td>68</td>
                        </tr>
                        <tr>
                          <td>3500000</td>
                          <td>69</td>
                        </tr>
                        <tr>
                          <td>3750000</td>
                          <td>70</td>
                        </tr>
                        <tr>
                          <td>4000000</td>
                          <td>71</td>
                        </tr>
                        <tr>
                          <td>4250000</td>
                          <td>72</td>
                        </tr>
                        <tr>
                          <td>4500000</td>
                          <td>73</td>
                        </tr>
                        <tr>
                          <td>4750000</td>
                          <td>74</td>
                        </tr>
                        <tr>
                          <td>5000000</td>
                          <td>75</td>
                        </tr>
                        <tr>
                          <td>5500000</td>
                          <td>76</td>
                        </tr>
                        <tr>
                          <td>6000000</td>
                          <td>77</td>
                        </tr>
                        <tr>
                          <td>6500000</td>
                          <td>78</td>
                        </tr>
                        <tr>
                          <td>7000000</td>
                          <td>79</td>
                        </tr>
                        <tr>
                          <td>7500000</td>
                          <td>80</td>
                        </tr>
                        <tr>
                          <td>8000000</td>
                          <td>81</td>
                        </tr>
                        <tr>
                          <td>8500000</td>
                          <td>82</td>
                        </tr>
                        <tr>
                          <td>9000000</td>
                          <td>83</td>
                        </tr>
                        <tr>
                          <td>9500000</td>
                          <td>84</td>
                        </tr>
                        <tr>
                          <td>10000000</td>
                          <td>85</td>
                        </tr>
                        <tr>
                          <td>11000000</td>
                          <td>86</td>
                        </tr>
                        <tr>
                          <td>12000000</td>
                          <td>87</td>
                        </tr>
                        <tr>
                          <td>13000000</td>
                          <td>88</td>
                        </tr>
                        <tr>
                          <td>14000000</td>
                          <td>89</td>
                        </tr>
                        <tr>
                          <td>15000000</td>
                          <td>90</td>
                        </tr>
                        <tr>
                          <td>16000000</td>
                          <td>91</td>
                        </tr>
                        <tr>
                          <td>17000000</td>
                          <td>92</td>
                        </tr>
                        <tr>
                          <td>18000000</td>
                          <td>93</td>
                        </tr>
                        <tr>
                          <td>19000000</td>
                          <td>94</td>
                        </tr>
                        <tr>
                          <td>20000000</td>
                          <td>95</td>
                        </tr>
                        <tr>
                          <td>21000000</td>
                          <td>96</td>
                        </tr>
                        <tr>
                          <td>22000000</td>
                          <td>97</td>
                        </tr>
                        <tr>
                          <td>23000000</td>
                          <td>98</td>
                        </tr>
                        <tr>
                          <td>24000000</td>
                          <td>99</td>
                        </tr>
                        <tr>
                          <td>25000000</td>
                          <td>100</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
