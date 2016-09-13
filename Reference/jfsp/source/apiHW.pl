#!/usr/bin/perl

use LWP::Simple;
use JSON qw( decode_json );
use Data::Dumper;
use strict;
use warnings;

my $stid = "WBB";
my $latestobs = "1";
my $token = "1234567890";

my $apiString = "stid=${stid}&latest_obs=${latestobs}&token=${token}";

my $json = get( "http://api.mesowest.net/stations?${apiString}" );
die "Could not get ${apiString}" unless defined $json;

my $decoded_json = decode_json( $json );

print Dumper $decoded_json;