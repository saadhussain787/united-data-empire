import re
import json

html = r"""<!DOCTYPE html>
<html lang="en">
    <head>
		<base href="https://understat.com/">
		<title>Hull 2 - 0 Manchester United (August 22 2026) | EPL | 2026/2027 | xG | Understat.com</title>
        <meta charset="UTF-8" />
		<meta name="description" content="Hull 2 - 0 Manchester United. Check out detailed player statistic, goals, assists, key passes, xG, shot map, xGplot.">
		<meta name="Keywords" content="Hull, Manchester United, EPL, 2026/2027, (August 22 2026), xG, expected goals, shot map">
		<meta name="viewport" user-scalable="no" content="width=device-width, maximum-scale=1, initial-scale=1">
		<script src="https://sdk.adlook.tech/inventory/core.js" async type="text/javascript"></script>
			<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
	<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
	<link rel="manifest" href="manifest.json">
	<link rel="mask-icon" href="safari-pinned-tab.svg" color="#5bbad5">
	<meta name="apple-mobile-web-app-title" content="understat">
	<meta name="application-name" content="understat">
	<meta name="theme-color" content="#ffffff">
	<meta http-equiv="cache-control" content="no-cache">
	<meta http-equiv="expires" content="0">
	<link href="css/main.min.css?t=1765221332" rel="stylesheet" media="screen">
    </head>
    <body class="theme-dark">
		<script>
			var THEME = localStorage.getItem("theme") || 'DARK';
			document.body.className = "theme-" + THEME.toLowerCase();
		</script>
        	<div class="wrapper">
				<header id="header" class="clearfix">
			<div class="header-wrapper">
					<span class="block-match-result">
		<h1>
			<a href="https://understat.com/team/Hull/2026">Hull</a> 2 - 0<a href="https://understat.com/team/Manchester_United/2026">Manchester United</a>
		</h1>
	</span>
				<nav class="m-navigation-main">
					<input class="toggle" id="toggle" type="checkbox">
					<label class="toggle" for="toggle">
						<div class="line-wrap">
							<div class="line top"></div>
							<div class="line center"></div>
							<div class="line bottom"></div>
						</div>
					</label>
					<ul class="h-inner">
						<li class="player-search">
							<input name="player-search" class="typeahead" type="search" placeholder="Find player by name" />
							<span class="icon"><i class="fa fa-search"></i></span>
							<!--
							<div class="li-container">
								<div class="li-inner">
									<input class="typeahead" type="search" placeholder="Find player by name" />
									<span class="icon"><i class="fa fa-search"></i></span>
								</div>
							</div>
							-->
						</li>
						<li>
							<a href="" class="menu-link ">
								<span class="link-icon" title="Main page">
									<i class="fas fa-home" aria-hidden="true"></i>
								</span>
								<span class="menu-title">
									<span class="link-icon">
										<i class="fas fa-home" aria-hidden="true"></i>
									</span>
									Main page
								</span>
							</a>
						</li>
						<li>
							<a href="office" class="menu-link ">
								<span class="link-icon" title="Personal cabinet">
									<i class="fas fa-sign-in-alt" aria-hidden="true"></i>
								</span>
								<span class="menu-title">
									<span class="link-icon">
										<i class="fas fa-sign-in-alt" aria-hidden="true"></i>
									</span>
									Personal cabinet
								</span>
							</a>
						</li>
					</ul>
				</nav>
			</div>
		</header>
		
		<div id="preloader" class="preloader">
			<div class="preloader-container">
				<div class="circ1"><div></div></div>
				<div class="circ2"><div></div></div>
				<div class="circ3"><div></div></div>
				<div class="circ4"><div></div></div>
			</div>
		</div>
		
		<div id="table-preloader" class="preloader table-preloader is-hide">
			<div class="preloader-container">
				<div class="circ1"><div></div></div>
				<div class="circ2"><div></div></div>
				<div class="circ3"><div></div></div>
				<div class="circ4"><div></div></div>
			</div>
		</div>
		
		<input id="themes-switch" type="checkbox" name="themes-switch" checked>
		<label for="themes-switch" title="Change theme"></label>
		
		<div class="page-wrapper">
										<div class="promotion">
				<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7470116180195095" data-ad-slot="2199699885" data-ad-format="auto" data-full-width-responsive="true"></ins>
			</div>
										<ul class="breadcrumb">
	<li><a href="https://understat.com/">Home</a></li>
	<li><a href="league/EPL/2026">EPL</a></li>
	<li>Aug 22 2026</li>
</ul>
			<div class="block">
	<div class="block-content is-hide">
		<div class="block-match">
			<div class="filters">
	<div class="filter">
		<input id="scheme1" type="radio" name="scheme" value="field" checked />
		<label for="scheme1">Field</label>
				<input id="scheme2" type="radio" name="scheme" value="chart" />
		<label for="scheme2">Timing chart</label>
		<input id="scheme3" type="radio" name="scheme" value="stats" />
		<label for="scheme3">Stats</label>
			</div>
</div>

<div class="scheme-block" data-scheme="field">
	<canvas id="field"></canvas>
	<i class="icon-full-screen"></i>
	<div id="note" style="display:none;"></div>
</div>

<div class="scheme-block is-hide" data-scheme="chart">
	<div class="chart-container-match">
		<canvas id="chart"></canvas>
	</div>
	<div class="chartjs-tooltip is-hide team-home"></div>
	<div class="chartjs-tooltip is-hide team-away"></div>
</div>

<div class="scheme-block is-hide" data-scheme="stats">
		<div class="progress-bar teams-titles">
		<div class="progress-title">TEAMS</div>
		<div class="progress-home progress-over" style="width: 50%">
			<div class="progress-value">Hull</div>
		</div>
		<div class="progress-away" style="width: 50%; left: 50%">
			<div class="progress-value">Manchester United</div>
		</div>
	</div>
	
	<div class="progress-bar">
		<div class="progress-title">CHANCES</div>
		<div class="progress-home" style="width: 29%" title="29%">
			<div class="progress-value">29<small>%</small></div>
		</div>
		<div class="progress-draw" style="width: 29%; left: 29%" title="29%">
			<div class="progress-value">29<small>%</small></div>
		</div>
		<div class="progress-away" style="width: 42%" title="42%">
			<div class="progress-value">42<small>%</small></div>
		</div>
	</div>
	
	<div class="progress-bar">
		<div class="progress-title">GOALS</div>
		<div class="progress-home progress-over" style="width: 100%" title="100%">
			<div class="progress-value">2</div>
		</div>
		<div class="progress-away" style="width: 0%; left: 100%" title="0%">
			<div class="progress-value">0</div>
		</div>
	</div>
	
	<div class="progress-bar">
		<div class="progress-title">xG</div>
		<div class="progress-home" style="width: 45.687494083988%" title="46%">
			<div class="progress-value">1<span class="progress-value-decimal">.50</span></div>
		</div>
		<div class="progress-away progress-over" style="width: 54.312505916012%; left: 45.687494083988%" title="54%">
			<div class="progress-value">1<span class="progress-value-decimal">.78</span></div>
		</div>
	</div>
		
	<div class="progress-bar">
		<div class="progress-title">SHOTS</div>
		<div class="progress-home" style="width: 27.586206896552%"  title="28%">
			<div class="progress-value">8</div>
		</div>
		<div class="progress-away progress-over" style="width: 72.413793103448%; left: 27.586206896552%" title="72%">
			<div class="progress-value">21</div>
		</div>
	</div>
		
	<div class="progress-bar">
		<div class="progress-title">SHOTS ON TARGET</div>
		<div class="progress-home" style="width: 44.444444444444%" title="44%">
			<div class="progress-value">4</div>
		</div>
		<div class="progress-away progress-over" style="width: 55.555555555556%; left: 44.444444444444%" title="56%">
			<div class="progress-value">5</div>
		</div>
	</div>
	
	<div class="progress-bar">
		<div class="progress-title" title="Passes completed within an estimated 20 yards of goal (crosses excluded)">DEEP</div>
		<div class="progress-home" style="width: 8.3333333333333%" title="8%">
			<div class="progress-value">1</div>
		</div>
		<div class="progress-away progress-over" style="width: 91.666666666667%; left: 8.3333333333333%" title="92%">
			<div class="progress-value">11</div>
		</div>
	</div>
		
	<div class="progress-bar">
		<div class="progress-title" title="Passes allowed per defensive action in the opposition half">PPDA</div>
		<div class="progress-home" style="width: 33.487236691078%" title="33%">
			<div class="progress-value">20<span class="progress-value-decimal">.57</span></div>
		</div>
		<div class="progress-away progress-over" style="width: 66.512763308922%; left: 33.487236691078%" title="67%">
			<div class="progress-value">10<span class="progress-value-decimal">.36</span></div>
		</div>
	</div>
	
	<div class="progress-bar">
		<div class="progress-title" title="Expected points">xPTS</div>
		<div class="progress-home" style="width: 42.919309632689%" title="43%">
			<div class="progress-value">1<span class="progress-value-decimal">.16</span></div>
		</div>
		<div class="progress-away progress-over" style="width: 57.080690367311%; left: 42.919309632689%" title="57%">
			<div class="progress-value">1<span class="progress-value-decimal">.55</span></div>
		</div>
	</div>
</div>
<script>
	var match_info 	= JSON.parse('\x7B\x22id\x22\x3A\x2231181\x22,\x22fid\x22\x3A\x221983548\x22,\x22h\x22\x3A\x2291\x22,\x22a\x22\x3A\x2289\x22,\x22date\x22\x3A\x222026\x2D08\x2D22\x2011\x3A30\x3A00\x22,\x22league_id\x22\x3A\x221\x22,\x22season\x22\x3A\x222026\x22,\x22h_goals\x22\x3A\x222\x22,\x22a_goals\x22\x3A\x220\x22,\x22team_h\x22\x3A\x22Hull\x22,\x22team_a\x22\x3A\x22Manchester\x20United\x22,\x22h_xg\x22\x3A\x221.49627\x22,\x22a_xg\x22\x3A\x221.77874\x22,\x22h_w\x22\x3A\x220.2918\x22,\x22h_d\x22\x3A\x220.2884\x22,\x22h_l\x22\x3A\x220.4198\x22,\x22league\x22\x3A\x22EPL\x22,\x22h_shot\x22\x3A\x228\x22,\x22a_shot\x22\x3A\x2221\x22,\x22h_shotOnTarget\x22\x3A\x224\x22,\x22a_shotOnTarget\x22\x3A\x225\x22,\x22h_deep\x22\x3A\x221\x22,\x22a_deep\x22\x3A\x2211\x22,\x22a_ppda\x22\x3A\x2210.3571\x22,\x22h_ppda\x22\x3A\x2220.5714\x22,\x22isData\x22\x3Atrue\x7D');
</script>		</div>
	</div>
</div>"""

all_json_vars = re.findall(r"(?:var\s+)?(\w+)\s*=\s*JSON\.parse\('([^']+)'\)", html)
print("Regex variables matched:", len(all_json_vars))
data_store = {}
for var_name, hex_content in all_json_vars:
    try:
        decoded_str = hex_content.encode("utf-8").decode("unicode_escape")
        data_store[var_name] = json.loads(decoded_str)
        print(f"Decoded {var_name}")
    except Exception as e:
        print(f"Failed to decode {var_name}: {e}")

print("Match info extracted:", data_store.get('match_info'))
