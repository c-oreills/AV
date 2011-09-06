var SCALE = 10;

party_colours = {
  A: 'yellow',
  B: 'blue',
  C: 'red',
  D: 'green',
  E: 'purple',
  F: 'orange',
  G: 'magenta',
  H: 'cyan',
  I: 'lawngreen',
};

ballots_old = [
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
];


function run_election() {
  // Clear output
  $('#out').html('');

  // Parse input
  var ballots = parse_ballots_in();

  // Run election script
  start_election(ballots);

  // Stop usual form submission
  return false;
}

$(document).ready(run_election);

function parse_ballots_in() {
  /* Parses the contents of #ballots-in which should consist of multiple lines
   * of the form
   *    prefs:n
   * where prefs is a list of preferences (characters A-I in preferred order)
   * and n is an integer representing the number of ballot papers with said preferences
   */
  var ballots = [];
  var ballots_in_text = $('#ballots-in').val();
  var ballot_pairs = ballots_in_text.replace(/ /g, '').split('\n');
  var i, len;
  for (i = 0, len = ballot_pairs.length; i < len; i++) {
    var ballot_pair = ballot_pairs[i];
    if (ballot_pair !== "") {
      var ballot = {};
      ballot_pair = ballot_pair.split(':');
      ballot.prefs = ballot_pair[0];
      ballot.n = parseInt(ballot_pair[1], 10);
      ballots.push(ballot);
    }
  }

  return ballots;
}

function start_election(ballots) {
  party_ballots = make_initial_party_ballots(ballots);

  // Assign initial votes
  party_ballots = assign_ballots(party_ballots, ballots);
  window.p = party_ballots;

  // Start the first round
  round(party_ballots);
}

function make_initial_party_ballots(ballots) {
  // Construct an initial list of parties with empty ballot lists
  var party_ballots = {};
  var i, len;
  for (i = 0, len = ballots.length; i < len; i++) {
    var ballot = ballots[i];
    // Only check the first candidate of each ballot
    // If a candidate does not appear as a first choice they are instantly eliminated
    var candidate = ballot.prefs[0];
    if (Object.keys(party_ballots).indexOf(candidate) === -1) {
      party_ballots[candidate] = [];
    }
  }
  return party_ballots;
}

function assign_ballots(party_ballots, ballots) {
  for (var i = 0, l = ballots.length; i < l; i++) {
    var ballot = ballots[i];
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
    for (var j = 0, l = party.length; j < l; j++) {
      var vote = party[j];
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
  announce("Party " + losing_party + " eliminated!");
  return assign_ballots(party_ballots, ballots)
}

function win_election(party) {
  announce("Party " + party + " has won!");
}

function draw_election(party_ballots) {
  for (var party in party_ballots) {
    announce("Party " + party + " has drawn!");
  }
}

/*
 * ==================== RENDERING CODE ====================
 */

function render_round(party_ballots, party_vote_nums, party_vote_stats) {
  var output_div = $("div#out");
  var graph = $("<div class='graph'/>");
  var max_col_height = party_vote_nums[party_vote_stats.max_party]/SCALE; 
  var graph_height = max_col_height + 20
  graph.css("height", graph_height);
  for (var party_name in party_ballots) {
    var party = party_ballots[party_name];

    var party_stack = render_party_stack(party, party_name);
    var party_label = render_party_label(party_name);

    var party_container = $("<div class='party-container' />");
    party_container.css("height", graph_height);
    party_container.append(party_stack);
    party_container.append(party_label);
    graph.append(party_container);
  }
  output_div.append(graph);
  output_div.append("<br/>");
}

function announce(message) {
  var output_div = $("div#out");
  output_div.append("<p class='announce'>" + message + "</p>");
  output_div.append("<br/>");
}

function render_party_stack(party, party_name) {
  var party_stack = $("<div class='stack' />");

  for (var i = party.length-1; i >= 0; i--) {
    var ballot = party[i];
    party_stack.append(render_ballot(ballot, party_name));
  }

  return party_stack
}

function render_party_label(party_name) {
  var party_label_name = $("<div class='party-label-name' />");
  party_label_name.html(party_name);

  var party_colour = $("<div class='party-colour' />");
  party_colour.css("background-color", party_colours[party_name]);

  var party_label = $("<div class='party-label' />");
  party_label.append(party_label_name);
  party_label.append(party_colour);

  return party_label;
}

function render_ballot(ballot, party_name){
  var ballot_stack = $("<div class='ballot'></div>");
  ballot_stack.css("height", ballot.n/SCALE);
  var col_width = 99/ballot.prefs.length + "%";
  // Discarded preferences only shown with half opacity
  var pref_opacity = 0.5;
  for (var i = 0, l = ballot.prefs.length; i < l; i++) {
    var pref = ballot.prefs[i];
    if (pref === party_name){
      pref_opacity = 1;
    }
    var ballot_col = $("<div class='ballot-col'></div>");
    ballot_col.css("background-color", party_colours[pref]);
    ballot_col.css("opacity", pref_opacity);
    ballot_col.css("width", col_width);
    ballot_col.css("height", ballot.n/SCALE - 1);
    ballot_stack.append(ballot_col);
  }
  return ballot_stack;
}

