/*
  # Ta bort notify-first-bid trigger och funktion

  Triggar och funktioner för notify-first-bid tas bort eftersom
  den funktionaliteten konsoliderats till notify-new-bid.
*/

DROP TRIGGER IF EXISTS notify_first_bid_trigger ON bids;
DROP FUNCTION IF EXISTS notify_first_bid_fn();
