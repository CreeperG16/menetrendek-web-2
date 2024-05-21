"use client";

import {
  Station,
  searchRoutes,
  Route,
  RouteInfo,
  FelszallasRouteInfoPart,
  RoutePart,
  AtszallasRouteInfoPart,
  LeszallasRouteInfoPart,
} from "menetrendek-api";
import { useEffect, useState } from "react";

enum SelectedField {
  None,
  From,
  To,
}

export default function Home() {
  const [fromContent, setFromContent] = useState("");
  const [toContent, setToContent] = useState("");
  const [selectedField, setSelectedField] = useState(SelectedField.None);

  const [isLoadingReq, setLoadingReq] = useState(false);
  const [contentHasUpdated, setContentHasUpdated] = useState([false, ""]);

  const [autocompleteValues, setAutocompleteValues] = useState<Station[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedRouteInfo, setSelectedRouteInfo] = useState<RouteInfo | null>(null);

  async function loadAutocomplete(query: string) {
    if (query.length < 2) {
      setAutocompleteValues([]);
      return;
    }

    setLoadingReq(true);
    const urlEncoded = encodeURI(query);
    const { result } = await fetch(`/api/search-stations?q=${urlEncoded}`).then((res) => res.json());
    const stations = result.map((s: { [key: string]: any }) => Station.fromJson(s));
    setAutocompleteValues(stations);
    setLoadingReq(false);

    const value = selectedField === SelectedField.From ? fromContent : toContent;
    if (value.length < 2) {
      setAutocompleteValues([]);
      return;
    }
    if (query !== value) loadAutocomplete(value);
  }

  useEffect(() => {
    if (selectedField === SelectedField.None) return;

    const value = selectedField === SelectedField.From ? fromContent : toContent;
    if (value.length < 2) {
      setAutocompleteValues([]);
      setLoadingReq(false);
      return;
    }

    if (isLoadingReq) {
      setContentHasUpdated([true, value]);
      return;
    }

    loadAutocomplete(value);
  }, [fromContent, toContent, selectedField]);

  useEffect(() => {
    if (isLoadingReq) return;
    if (!contentHasUpdated[0]) return;

    loadAutocomplete(contentHasUpdated[1] as string);
    setContentHasUpdated([false, ""]);
  }, [isLoadingReq]);

  function selectStation(station: Station) {
    if (selectedField === SelectedField.None) return;
    const [setValue, setStation] =
      selectedField === SelectedField.From ? [setFromContent, setSelectedFrom] : [setToContent, setSelectedTo];

    setValue(station.stationName);
    setStation(station);
    setSelectedField(SelectedField.None);
    setAutocompleteValues([]);
  }

  async function searchForRoutes() {
    setSelectedRoute(null);
    setAutocompleteValues([]);
    setSelectedField(SelectedField.None);

    if (selectedFrom === null || selectedTo === null) return; // TODO
    setLoadingReq(true);

    //const result = await searchRoutes(selectedFrom, selectedTo);
    const { result } = await fetch("/api/search-routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: selectedFrom.json(),
        to: selectedTo.json(),
      }),
    }).then((res) => res.json());

    const routes = result.map((r: { [key: string]: any }) => Route.fromJson(r));

    setAvailableRoutes(routes);
    setLoadingReq(false);
  }

  async function selectRoute(route: Route) {
    setSelectedRoute(route);

    setLoadingReq(true);
    const info = await route.getMoreInfo();
    setLoadingReq(false);
    setSelectedRouteInfo(info);
  }

  function infoPart(part: FelszallasRouteInfoPart | AtszallasRouteInfoPart | LeszallasRouteInfoPart) {
    if (!selectedRoute || !selectedRouteInfo) return <></>;
    switch (part.muvelet) {
      case "felszállás":
        const infoPart = part as FelszallasRouteInfoPart;
        const routePart = selectedRoute.getPart(infoPart.runId) as RoutePart;
        if (!routePart) console.log(infoPart, selectedRoute);

        return (
          <div className="flex flex-col space-y-5 items-center p-2">
            <h1>
              {routePart.from.stationName}
              {routePart.from.bay && " [" + routePart.from.bay + "]"}
            </h1>
            <h1>{infoPart.name}</h1>
            <h1>{routePart.to.stationName}</h1>
            {/*{infoPart.expectedDeparture.toLocaleTimeString(undefined, { timeStyle: "short" })} {infoPart.stationName} {infoPart.name}*/}
          </div>
        );
      case "átszállás":
        return (
          <>
            {part.muvelet} - {part.stationName}
          </>
        );
      case "leszállás":
        return (
          <>
            {part.muvelet} - {part.stationName}
          </>
        );
    }
  }

  return (
    <main className="flex flex-col bg-slate-900 w-full h-full">
      <div id="navbar" className="flex flex-row items-center bg-slate-950">
        <h1 id="title" className="text-3xl m-3">
          Menetredn
        </h1>
        <h1>{selectedRoute && selectedRoute.from.stationName + " - " + selectedRoute.to.stationName}</h1>
      </div>

      <div id="content" className="flex flex-col items-center w-full h-full">
        <div className="flex mt-2 mb-2 flex-row items-center justify-center w-1/2">
          <input
            className="bg-slate-950 border-none m-1 p-1 w-1/2"
            type="text"
            placeholder="From:"
            name="travel-from"
            id="travel-from"
            onFocus={() => setSelectedField(SelectedField.From)}
            onChange={(ev) => setFromContent(ev.target.value)}
            value={fromContent}
          />
          <input
            className="bg-slate-950 border-none m-1 p-1 w-1/2"
            type="text"
            placeholder="To:"
            name="travel-to"
            id="travel-to"
            onFocus={() => setSelectedField(SelectedField.To)}
            onChange={(ev) => setToContent(ev.target.value)}
            value={toContent}
          />
          <button
            className="m-1 bg-slate-950 p-1 hover:scale-[1.05] hover:bg-slate-800"
            onClick={() => searchForRoutes()}>
            Go!
          </button>
        </div>

        <div id="autocomplete" className="absolute top-28 flex flex-col w-1/2">
          {isLoadingReq && <div className="absolute z-20">Loading...</div>}
          {selectedField !== SelectedField.None ? (
            autocompleteValues.map((station) => {
              console.log(station);
              return (
                <div
                  className="bg-slate-800 p-1 m-1 hover:scale-[1.01] hover:bg-slate-700 z-10"
                  onClick={() => selectStation(station)}
                  key={station.stationId.toString() + "_" + station.settlementId.toString()}>
                  <p>{station.stationName}</p>
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>

        <div className="flex flex-row w-screen h-full relative">
          <div
            id="current-routes"
            className={`flex ${selectedRoute ? "w-1/3" : "w-full"} h-full bg-slate-900 items-center flex-col`}>
            {availableRoutes.map((route) => (
              <div
                className={
                  (selectedRoute === null ? "w-1/2 " : "w-[95%] ") + "my-1 bg-slate-950 p-3 hover:scale-[1.01]"
                }
                onClick={() => selectRoute(route)}
                key={route.routeId}>
                <div className="flex flex-row w-full">
                  <p className="flex-1">
                    {route.from.stationName}
                    {route.from.bay && ` [${route.from.bay}]`}
                  </p>
                  <p className="flex-1 text-right">
                    {route.departure.toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex flex-row w-full">
                  <p className="flex-1">
                    {route.to.stationName}
                    {route.to.bay && ` [${route.to.bay}]`}
                  </p>
                  <p className="flex-1 text-right">
                    {route.arrival.toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className={selectedRoute === null ? "hidden" : "w-2/3"}>
            {selectedRoute && (
              <div className="">
                <button
                  className="absolute right-5 top-2 p-1 w-8 h-8 rounded-lg flex items-center justify-center bg-red-500 hover:scale-[1.1]"
                  onClick={() => setSelectedRoute(null)}>
                  X
                </button>
                <h1 className="font-extrabold text-3xl m-2 mb-4">
                  {selectedRoute.from.stationName} - {selectedRoute.to.stationName}
                </h1>
                <div>
                  {/* parts */}
                  {/*{selectedRoute!.routeParts.map((part) => (
                    <div className="flex flex-col bg-slate-950 my-1 mx-2 p-1" key={part.runId}>
                      <div className="flex flex-col space-x-1 space-y-1 p-1">
                        <h1 className="font-bold">[{part.name}]</h1>
                        <p>
                          {part.from.stationName} - {part.departure.toLocaleTimeString()}
                        </p>
                        <p>
                          {part.to.stationName} - {part.arrival.toLocaleTimeString()}
                        </p>
                        <p>{part.distance / 1e3}km</p>
                      </div>
                    </div>
                  ))}*/}
                  {selectedRouteInfo &&
                    selectedRouteInfo.parts.map((part, i) => (
                      <div className="flex flex-col bg-slate-950 my-1 mx-2 p-1" key={i.toString() + "_" + part.muvelet}>
                        {/*<h1>
                          {part.stationName} - {part.muvelet}
                        </h1>*/}
                        {infoPart(part)}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
