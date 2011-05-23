var SCALE = 10;

party_colours = {
  A: 'yellow',
  B: 'blue',
  C: 'red',
  D: 'green',
  E: 'purple',
  F: 'orange',
}

ballots = [
  {
    n: 500,
    prefs: 'ABDC'
  },
  {
    n: 500,
    prefs: 'ADBC'
  },
  {
    n: 700,
    prefs: 'BAC'
  },
  {
    n: 700,
    prefs: 'BCA'
  },
  {
    n: 1200,
    prefs: 'C'
  },
  {
    n: 300,
    prefs: 'DB'
  },
  {
    n: 300,
    prefs: 'DC'
  },
  {
    n: 120,
    prefs: 'E'
  },
  {
    n: 80,
    prefs: 'FC'
  },
]

function start() {
  // Construct an initial list of parties with empty ballot lists
  var party_ballots = {};
  for (var i in party_colours) {
    party_ballots[i] = [];
  }

  // Assign initial votes
  party_ballots = assign_ballots(party_ballots, ballots);
  window.p = party_ballots;

  // Start the first round
  round(party_ballots);
}

$(document).ready(start);

function assign_ballots(party_ballots, ballots) {
  for each (var ballot in ballots) {
    party_ballots = assign_ballot(party_ballots, ballot);
  }
  return party_ballots;
}

function assign_ballot(party_ballots, ballot) {
  // Iterate through the preference list of a ballot
  // Assign the ballot to the first party possible
  for (var prefs_len = ballot.prefs.length, i = 0; i < prefs_len; i++) {
    var pref = ballot.prefs[i];
    if (party_ballots[pref] != undefined) {
      party_ballots[pref].push(ballot);
      return party_ballots;
    }
  }
  return party_ballots;
}

function count_votes(party_ballots) {
  var party_vote_nums = {};

  for (var i in party_ballots) {
    var party = party_ballots[i];
    party_vote_nums[i] = 0;
    for each (var vote in party) {
      party_vote_nums[i] += vote.n;
    }
  }

  return party_vote_nums;
}

function get_stats(party_vote_nums) {
  // Initialise stats for processing
  var party_vote_stats = {
    min_party: Object.keys(party_vote_nums)[0], // party with the least votes
    max_party: Object.keys(party_vote_nums)[0], // party with the most votes
    total: 0,                                   // total votes
  };

  // Loop through each party's votes
  for (var party in party_vote_nums) {
    var num = party_vote_nums[party];
    // Check if this party is the new minimum
    if (num < party_vote_nums[party_vote_stats.min_party]) {
      party_vote_stats.min_party = party;
    }
    // Check if this party is the new maximum
    if (num > party_vote_nums[party_vote_stats.max_party]) {
      party_vote_stats.max_party = party;
    }
    // Keep track of total number of votes
    party_vote_stats.total += num;
  }

  return party_vote_stats;
}

function round(party_ballots) {
  // Count up all the votes for the party_ballots
  var party_vote_nums = count_votes(party_ballots);
  var party_vote_stats = get_stats(party_vote_nums);

  window.pvn = party_vote_nums;
  window.pvs = party_vote_stats;

  render_round(party_ballots, party_vote_nums, party_vote_stats);

  // Has the leading party got more than 50% of remaining votes?
  // If so, winner!
  if (party_vote_nums[party_vote_stats.max_party] > party_vote_stats.total/2) {
    win_election(party_vote_stats.max_party);
  }
  // Handle an edge case here.
  // What if all remaining candidates have the same number of votes?
  else if (party_vote_stats.min_party == party_vote_stats.max_party) {
    draw_election(party_ballots);
  }
  else {
    // Remove the party with the lowest votes and redistribute votes
    // TODO: Edge case: What if two or more party_ballots have joint lowest votes?
    //       What does legislation actually say about this?!
    party_ballots = redistribute(party_ballots, party_vote_stats.min_party);
    round(party_ballots);
  }
}

function redistribute(party_ballots, losing_party) {
  var ballots = party_ballots[losing_party];
  delete party_ballots[losing_party];
  return assign_ballots(party_ballots, ballots)
}

function win_election(party) {
  console.log("Party " + party + " has won!");
}

function draw_election(party_ballots) {
  for (var party in party_ballots) {
    console.log("Party " + party + " has drawn!");
  }
}

/*
 * ==================== RENDERING CODE ====================
 */

function render_round(party_ballots, party_vote_nums, party_vote_stats) {
  var output_div = $("div#out");
  var graph = $("<div class='graph'/>");
  var graph_height = party_vote_nums[party_vote_stats.max_party]/SCALE;
  graph.css("height", graph_height);
  for (var i in party_ballots) {
    var party = party_ballots[i];
    var party_stack = $("<div class='stack' />");
    party_stack.css("height", graph_height);

    for (var i = party.length-1; i >= 0; i--) {
      var ballot = party[i];
      party_stack.append(render_ballot(ballot));
    }
    graph.append(party_stack);
  }
  output_div.append(graph);
  output_div.append("<br/>");
}

function render_ballots(ballots) {
  for (var i in ballots) {
    ballots[i] = render_ballot(ballots[i]);
  }
  return ballots;
}

function render_ballot(ballot){
  var ballot_stack = $("<div class='ballot'></div>");
  ballot_stack.css("height", ballot.n/SCALE);
  var col_width = 99/ballot.prefs.length + "%";
  for each (var pref in ballot.prefs) {
    var ballot_col = $("<div class='ballot-col'></div>");
    ballot_col.css("background-color", party_colours[pref]);
    ballot_col.css("width", col_width);
    ballot_col.css("height", ballot.n/SCALE - 1);
    ballot_stack.append(ballot_col);
  }
  return ballot_stack;
}

